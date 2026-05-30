from fastapi import APIRouter, Depends, Request
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
from app.core.constants import BidStatus, ListingStatus
from app.core.exceptions import NotFoundError, BadRequestError
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
    result = await db.execute(select(Listing).where(Listing.id == listing_id).with_for_update())
    listing = result.scalar_one_or_none()

    if not listing:
        raise NotFoundError("Listing not found")
    if listing.status != ListingStatus.ACTIVE:
        raise BadRequestError("Auction is not active")
    if datetime.now(timezone.utc) > listing.auction_end_time:
        raise BadRequestError("Auction has ended")
    if str(listing.seller_id) == bidder_id:
        raise BadRequestError("Listing owners cannot bid on their own listings")

    # Validate amount — must be at least 5% above current price or starting price
    floor = Decimal(str(listing.current_price or listing.starting_price))
    if listing.current_price:
        min_required = floor * (1 + MIN_BID_INCREMENT)
    else:
        min_required = floor  # first bid just needs to meet starting price

    if amount < min_required:
        raise BadRequestError(f"Minimum bid is ${float(min_required):.2f}")

    # Mark previous highest bid as outbid
    prev_result = await db.execute(
        select(Bid).where(Bid.listing_id == listing_id, Bid.status == BidStatus.ACTIVE)
    )
    prev_bid = prev_result.scalar_one_or_none()
    if prev_bid:
        prev_bid.status = BidStatus.OUTBID
        prev_bid.is_winning = False

    # Place new bid
    new_bid = Bid(
        listing_id=listing_id,
        bidder_id=bidder_id,
        amount=amount,
        status=BidStatus.ACTIVE,
        is_winning=True,
        bidder_ip=bidder_ip,
    )
    db.add(new_bid)

    # Update listing
    listing.current_price = amount
    listing.bid_count = (listing.bid_count or 0) + 1

    # Soft close — extend if bid placed in final window
    if listing.soft_close_enabled:
        time_left = (listing.auction_end_time - datetime.now(timezone.utc)).total_seconds()
        if time_left < SOFT_CLOSE_WINDOW:
            listing.auction_end_time = listing.auction_end_time + timedelta(seconds=SOFT_CLOSE_EXTENSION)

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
    client_ip = request.client.host if request.client else None
    return await place_bid_logic(
        listing_id=str(bid_in.listing_id),
        bidder_id=str(current_user.id),
        amount=Decimal(str(bid_in.amount)),
        bidder_ip=client_ip,
        db=db,
    )


@router.get("/listing/{listing_id}", response_model=List[BidResponse])
async def get_bid_history(listing_id: UUID, db: AsyncSession = Depends(get_db)):
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
    result = await db.execute(
        select(Bid)
        .where(Bid.bidder_id == current_user.id)
        .order_by(Bid.placed_at.desc())
    )
    return result.scalars().all()