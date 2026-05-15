from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.bid import Bid
from app.models.user import User
from app.models.listing import Listing
from app.schemas.bid import BidCreate, BidResponse
from app.core.dependencies import get_current_user
from app.core.constants import UserRole, BidStatus, ListingStatus
from app.core.exceptions import NotFoundError, BadRequestError, ForbiddenError
from decimal import Decimal
from datetime import datetime, timezone, timedelta

router = APIRouter()

MIN_BID_INCREMENT = Decimal("0.05")   # 5% above current
SOFT_CLOSE_WINDOW = 120               # seconds
SOFT_CLOSE_EXTENSION = 120            # seconds

async def place_bid_logic(
    listing_id: str,
    bidder_id: str,
    amount: Decimal,
    bidder_ip: str,
    db: AsyncSession,
) -> Bid:
    """Place a bid on a listing with soft-close auction logic."""
    result = await db.execute(select(Listing).where(Listing.id == listing_id).with_for_update())
    listing = result.scalar_one_or_none()

    if not listing:
        raise NotFoundError("Listing not found")
    if listing.status != ListingStatus.ACTIVE:
        raise BadRequestError("Auction is not active")
    if datetime.now(timezone.utc) > listing.ends_at:
        raise BadRequestError("Auction has ended")
    if str(listing.owner_id) == bidder_id:
        raise BadRequestError("Listing owners cannot bid on their own listings")

    # Validate amount
    floor = Decimal(str(listing.current_price or listing.min_price))
    min_required = floor if not listing.current_price else floor * (1 + MIN_BID_INCREMENT)
    min_required = max(min_required, Decimal(str(listing.min_price)))

    if amount < min_required:
        raise BadRequestError(f"Minimum bid is {float(min_required):.2f}")

    # Mark previous highest bid as outbid
    prev_result = await db.execute(
        select(Bid).where(Bid.listing_id == listing_id, Bid.status == BidStatus.ACTIVE)
    )
    prev_bid = prev_result.scalar_one_or_none()
    outbid_user_id = None
    if prev_bid:
        prev_bid.status = BidStatus.OUTBID
        outbid_user_id = str(prev_bid.bidder_id)

    # Place new bid
    new_bid = Bid(
        listing_id=listing_id,
        bidder_id=bidder_id,
        amount=amount,
        bidder_ip=bidder_ip,
    )
    db.add(new_bid)

    # Update listing
    listing.current_price = amount
    listing.bid_count = (listing.bid_count or 0) + 1

    # Soft close — extend if bid in final window
    if listing.soft_close_enabled:
        time_left = (listing.ends_at - datetime.now(timezone.utc)).total_seconds()
        if time_left < SOFT_CLOSE_WINDOW:
            listing.ends_at = listing.ends_at + timedelta(seconds=SOFT_CLOSE_EXTENSION)

    await db.commit()
    await db.refresh(new_bid)

    return new_bid

@router.post("/", response_model=BidResponse, status_code=201)
async def create_bid(
    bid_in: BidCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Place a bid on a listing."""
    client_ip = request.client.host if request.client else None
    return await place_bid_logic(
        listing_id=str(bid_in.listing_id),
        bidder_id=str(current_user.id),
        amount=bid_in.amount,
        bidder_ip=client_ip,
        db=db,
    )

@router.get("/listing/{listing_id}", response_model=List[BidResponse])
async def get_bid_history(listing_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get all bids for a listing, ordered by amount (highest first)."""
    result = await db.execute(
        select(Bid)
        .where(Bid.listing_id == listing_id)
        .order_by(Bid.amount.desc())
    )
    return result.scalars().all()

@router.get("/my", response_model=List[BidResponse])
async def get_my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all bids placed by the current user."""
    result = await db.execute(
        select(Bid)
        .where(Bid.bidder_id == current_user.id)
        .order_by(Bid.placed_at.desc())
    )
    return result.scalars().all()
