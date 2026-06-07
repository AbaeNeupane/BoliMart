from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone
import math

from app.database import get_db
from app.models.listing import Listing, Category
from app.models.bid import Bid
from app.models.user import User
from app.schemas.listing import (
    ListingCreate,
    ListingUpdate,
    ListingResponse,
    ListingListResponse,
)
from app.core.dependencies import get_current_user, get_optional_user
from app.core.constants import UserRole, ListingStatus
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError

router = APIRouter()

PAGE_SIZE = 20


# ---------------------------------------------------------------------------
# GET /listings/categories — list all categories (no auth required)
# ---------------------------------------------------------------------------
@router.get("/categories", response_model=List[dict])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    cats = result.scalars().all()
    return [{"id": str(c.id), "name": c.name, "slug": c.slug} for c in cats]


def _serialize_listing(listing: Listing) -> dict:
    """Convert a Listing ORM object to a dict that ListingResponse can accept."""
    return {
        "id": str(listing.id),
        "title": listing.title,
        "description": listing.description,
        "starting_price": float(listing.starting_price),
        "current_price": float(listing.current_price) if listing.current_price else None,
        "reserve_price": float(listing.reserve_price) if listing.reserve_price else None,
        "buy_now_price": float(listing.buy_now_price) if listing.buy_now_price else None,
        "image_urls": listing.image_urls or [],
        "status": listing.status,
        "bid_count": listing.bid_count or 0,
        "condition": listing.condition,
        "location": listing.location,
        "shipping_available": listing.shipping_available,
        "soft_close_enabled": listing.soft_close_enabled,
        "starts_at": listing.starts_at,
        "auction_end_time": listing.auction_end_time,
        "created_at": listing.created_at,
        "seller_id": str(listing.seller_id),
        "seller": {
            "id": str(listing.seller.id),
            "username": listing.seller.username,
            "full_name": listing.seller.full_name,
        } if listing.seller else None,
        "category_id": str(listing.category_id) if listing.category_id else None,
        "category": {
            "id": str(listing.category.id),
            "name": listing.category.name,
            "slug": listing.category.slug,
        } if listing.category else None,
    }


# ---------------------------------------------------------------------------
# GET /listings — browse with filters, search, sort, pagination
# ---------------------------------------------------------------------------
@router.get("/", response_model=ListingListResponse)
async def get_listings(
    q: Optional[str] = Query(None, description="Search title and description"),
    category: Optional[str] = Query(None, description="Category name or slug"),
    status: Optional[str] = Query("active", description="Listing status filter"),
    sort: Optional[str] = Query("ending_soon", description="ending_soon | newest | price_asc | price_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = (
        select(Listing)
        .options(selectinload(Listing.seller), selectinload(Listing.category))
    )

    # Status filter — default to active for public browse
    if status and status != "all":
        query = query.where(Listing.status == status)

    # Search — simple ILIKE on title and description
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.where(
            or_(
                Listing.title.ilike(term),
                Listing.description.ilike(term),
            )
        )

    # Category filter — match by name or slug via join
    if category and category.strip():
        query = query.join(Category, Listing.category_id == Category.id).where(
            or_(
                Category.name.ilike(f"%{category.strip()}%"),
                Category.slug.ilike(f"%{category.strip()}%"),
            )
        )

    # Count total before pagination
    count_q = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    # Sort
    if sort == "ending_soon":
        query = query.order_by(asc(Listing.auction_end_time))
    elif sort == "newest":
        query = query.order_by(desc(Listing.created_at))
    elif sort == "price_asc":
        query = query.order_by(asc(func.coalesce(Listing.current_price, Listing.starting_price)))
    elif sort == "price_desc":
        query = query.order_by(desc(func.coalesce(Listing.current_price, Listing.starting_price)))
    else:
        query = query.order_by(asc(Listing.auction_end_time))

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    listings = result.scalars().all()

    items = [ListingResponse(**_serialize_listing(l)) for l in listings]

    return ListingListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 1,
    )


# ---------------------------------------------------------------------------
# GET /listings/{id} — single listing detail
# ---------------------------------------------------------------------------
@router.get("/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Listing)
        .options(selectinload(Listing.seller), selectinload(Listing.category))
        .where(Listing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise NotFoundError("Listing not found")

    return ListingResponse(**_serialize_listing(listing))


# ---------------------------------------------------------------------------
# POST /listings — create a new listing
# FIX: Schedule end_auction_task precisely at auction_end_time so the DB
#      updates exactly when the timer hits zero, not up to 60s later.
# ---------------------------------------------------------------------------
@router.post("/", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    data: ListingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)

    # Validate category if provided
    category_uuid = None
    if data.category_id:
        try:
            category_uuid = UUID(data.category_id)
        except ValueError:
            raise BadRequestError("Invalid category_id format")
        cat_result = await db.execute(
            select(Category).where(Category.id == category_uuid)
        )
        if not cat_result.scalar_one_or_none():
            raise NotFoundError("Category not found")

    # Ensure timestamps are timezone-aware
    starts_at = data.starts_at
    if starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)

    auction_end_time = data.auction_end_time
    if auction_end_time.tzinfo is None:
        auction_end_time = auction_end_time.replace(tzinfo=timezone.utc)

    if auction_end_time <= now:
        raise BadRequestError("auction_end_time must be in the future")

    listing = Listing(
        seller_id=current_user.id,
        category_id=category_uuid,
        title=data.title,
        description=data.description,
        starting_price=data.starting_price,
        current_price=None,           # set on first bid
        reserve_price=data.reserve_price,
        buy_now_price=data.buy_now_price,
        image_urls=data.image_urls or [],
        condition=data.condition,
        location=data.location,
        shipping_available=data.shipping_available,
        soft_close_enabled=data.soft_close_enabled,
        starts_at=starts_at,
        auction_end_time=auction_end_time,
        status=ListingStatus.ACTIVE,
        bid_count=0,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)

    # Schedule the auction close task to fire exactly when the timer ends.
    # This works alongside Beat (which acts as a safety net every 60s).
    try:
        from app.workers.auction_tasks import end_auction_task
        delay_seconds = (auction_end_time - now).total_seconds()
        end_auction_task.apply_async(
            args=[str(listing.id)],
            countdown=int(delay_seconds) + 1,  # +1s buffer to avoid timezone edge cases
        )
    except Exception as e:
        # Never fail listing creation because of Celery
        print(f"Warning: Could not schedule end_auction_task for {listing.id}: {e}")

    # Re-fetch with relationships loaded
    result = await db.execute(
        select(Listing)
        .options(selectinload(Listing.seller), selectinload(Listing.category))
        .where(Listing.id == listing.id)
    )
    listing = result.scalar_one()
    return ListingResponse(**_serialize_listing(listing))


# ---------------------------------------------------------------------------
# PATCH /listings/{id} — update listing (owner only, before first bid)
# ---------------------------------------------------------------------------
@router.patch("/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: UUID,
    data: ListingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Listing)
        .options(selectinload(Listing.seller), selectinload(Listing.category))
        .where(Listing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise NotFoundError("Listing not found")

    # Only the seller or an admin can edit
    is_owner = str(listing.seller_id) == str(current_user.id)
    is_admin = current_user.role == UserRole.ADMIN
    if not is_owner and not is_admin:
        raise ForbiddenError("You do not own this listing")

    # Disallow edits once there are bids
    if listing.bid_count and listing.bid_count > 0 and not is_admin:
        raise BadRequestError("Cannot edit a listing that already has bids")

    # Apply only the fields that were sent
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(listing, field, value)

    await db.commit()
    await db.refresh(listing)

    result = await db.execute(
        select(Listing)
        .options(selectinload(Listing.seller), selectinload(Listing.category))
        .where(Listing.id == listing.id)
    )
    listing = result.scalar_one()
    return ListingResponse(**_serialize_listing(listing))


# ---------------------------------------------------------------------------
# DELETE /listings/{id} — cancel listing (owner or admin)
# ---------------------------------------------------------------------------
@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_listing(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Listing).where(Listing.id == listing_id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise NotFoundError("Listing not found")

    is_owner = str(listing.seller_id) == str(current_user.id)
    is_admin = current_user.role == UserRole.ADMIN
    if not is_owner and not is_admin:
        raise ForbiddenError("You do not own this listing")

    if listing.status in (ListingStatus.SOLD, ListingStatus.ENDED):
        raise BadRequestError("Cannot cancel a listing that has already ended")

    listing.status = ListingStatus.CANCELLED
    await db.commit()


# ---------------------------------------------------------------------------
# GET /listings/my — authenticated user's own listings
# ---------------------------------------------------------------------------
@router.get("/my/listings", response_model=ListingListResponse)
async def get_my_listings(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Listing)
        .options(selectinload(Listing.seller), selectinload(Listing.category))
        .where(Listing.seller_id == current_user.id)
    )

    if status and status != "all":
        query = query.where(Listing.status == status)

    count_q = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    query = query.order_by(desc(Listing.created_at))
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    listings = result.scalars().all()
    items = [ListingResponse(**_serialize_listing(l)) for l in listings]

    return ListingListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 1,
    )