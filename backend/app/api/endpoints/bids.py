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
from app.core.exceptions import NotFoundError, BadRequestError, ForbiddenError
from decimal import Decimal, ROUND_UP
from datetime import datetime, timezone, timedelta

router = APIRouter()

MIN_BID_INCREMENT = Decimal("0.10")
SOFT_CLOSE_WINDOW = 120
SOFT_CLOSE_EXTENSION = 120


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

    floor = Decimal(str(listing.current_price or listing.starting_price))

    if listing.current_price:
        min_required = (floor + MIN_BID_INCREMENT).quantize(Decimal("0.01"), rounding=ROUND_UP)
    else:
        min_required = floor

    if amount < min_required:
        raise BadRequestError(f"Minimum bid is ${float(min_required):.2f}")

    prev_result = await db.execute(
        select(Bid).where(Bid.listing_id == listing_id, Bid.status == BidStatus.ACTIVE)
    )
    prev_bid = prev_result.scalar_one_or_none()
    outbid_user_id = None
    if prev_bid:
        if str(prev_bid.bidder_id) == bidder_id:
            # Same person raising their own bid — cancel their previous bid silently
            prev_bid.status = BidStatus.CANCELLED
        else:
            # Different person outbid — mark as outbid and notify
            prev_bid.status = BidStatus.OUTBID
            outbid_user_id = str(prev_bid.bidder_id)
        prev_bid.is_winning = False

    new_bid = Bid(
        listing_id=listing_id,
        bidder_id=bidder_id,
        amount=amount,
        status=BidStatus.ACTIVE,
        is_winning=True,
        bidder_ip=bidder_ip,
    )
    db.add(new_bid)

    listing.current_price = amount
    listing.bid_count = (listing.bid_count or 0) + 1

    if listing.soft_close_enabled:
        time_left = (listing.auction_end_time - datetime.now(timezone.utc)).total_seconds()
        if time_left < SOFT_CLOSE_WINDOW:
            listing.auction_end_time = listing.auction_end_time + timedelta(seconds=SOFT_CLOSE_EXTENSION)

    await db.commit()
    await db.refresh(new_bid)

    # Broadcast new bid to all WebSocket clients watching this listing
    try:
        from app.api.endpoints.websocket import broadcast_bid
        await broadcast_bid(str(listing_id), {
            "listing_id": str(listing_id),
            "bid_id": str(new_bid.id),
            "bid_amount": float(new_bid.amount),
            "bid_count": listing.bid_count,
            "bidder_id": str(new_bid.bidder_id),
            "auction_end_time": listing.auction_end_time.isoformat(),
        })
    except Exception:
        pass  # Never fail a bid because of WebSocket broadcast

    # Create in-app notifications using a fresh independent session
    try:
        from app.services.notification_service import notify_outbid, notify_new_bid_seller
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as notif_db:
            if outbid_user_id and outbid_user_id != bidder_id:
                await notify_outbid(notif_db, outbid_user_id, listing_id, listing.title, float(amount))
            if str(listing.seller_id) != bidder_id:
                await notify_new_bid_seller(notif_db, listing.seller_id, listing_id, listing.title, float(amount))
    except Exception:
        pass  # Never fail a bid because of notification

    # Fire outbid email in background (non-blocking)
    if outbid_user_id:
        try:
            from app.workers.email_tasks import send_outbid_email_task
            send_outbid_email_task.delay(
                outbid_user_id,
                listing.title,
                str(listing.id),
                float(amount),
            )
        except Exception:
            print(f"NOTIFICATION ERROR: {e}")
            import traceback
            traceback.print_exc()

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


@router.delete("/{bid_id}", status_code=204)
async def cancel_bid(
    bid_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Bid).where(Bid.id == bid_id))
    bid = result.scalar_one_or_none()
    if not bid:
        raise NotFoundError("Bid not found")
    if str(bid.bidder_id) != str(current_user.id):
        raise ForbiddenError("You can only cancel your own bids")
    if bid.status != BidStatus.ACTIVE:
        raise BadRequestError("Only your current winning bid can be cancelled")

    listing_result = await db.execute(
        select(Listing).where(Listing.id == bid.listing_id).with_for_update()
    )
    listing = listing_result.scalar_one_or_none()
    if not listing:
        raise NotFoundError("Listing not found")
    if listing.status != ListingStatus.ACTIVE:
        raise BadRequestError("Auction is no longer active")

    time_left = (listing.auction_end_time - datetime.now(timezone.utc)).total_seconds()
    if time_left < 3600:
        raise BadRequestError("Cannot cancel a bid within 1 hour of auction ending")

    bid.status = BidStatus.CANCELLED
    bid.is_winning = False

    prev_result = await db.execute(
        select(Bid)
        .where(
            Bid.listing_id == bid.listing_id,
            Bid.status == BidStatus.OUTBID,
            Bid.id != bid.id,
        )
        .order_by(Bid.amount.desc())
    )
    prev_bid = prev_result.scalars().first()

    if prev_bid:
        prev_bid.status = BidStatus.ACTIVE
        prev_bid.is_winning = True
        listing.current_price = prev_bid.amount
    else:
        listing.current_price = None

    listing.bid_count = max(0, (listing.bid_count or 1) - 1)
    await db.commit()


@router.get("/listing/{listing_id}", response_model=List[BidResponse])
async def get_bid_history(listing_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Bid, User.username)
        .join(User, User.id == Bid.bidder_id)
        .where(
            Bid.listing_id == listing_id,
            Bid.status != BidStatus.CANCELLED,
        )
        .order_by(Bid.amount.desc())
    )
    rows = result.all()
    bids = []
    for bid, username in rows:
        bid.bidder_username = username
        bids.append(bid)
    return bids


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