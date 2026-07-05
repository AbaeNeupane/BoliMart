from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.listing import Listing
from app.models.bid import Bid
from app.core.constants import BidStatus, ListingStatus
from datetime import datetime, timezone


class AuctionService:

    @staticmethod
    async def end_auction(db: AsyncSession, listing_id: str):
        """
        End an auction — mark listing as ended, notify winner and seller.
        Call this from a scheduler or Celery task when auction_end_time is reached.
        """
        result = await db.execute(
            select(Listing).where(Listing.id == listing_id).with_for_update()
        )
        listing = result.scalar_one_or_none()

        if not listing:
            return
        if listing.status != ListingStatus.ACTIVE:
            return  # Already ended

        listing.status = ListingStatus.ENDED
        await db.commit()

        # Find the winning bid
        bid_result = await db.execute(
            select(Bid)
            .where(Bid.listing_id == listing_id, Bid.status == BidStatus.ACTIVE)
        )
        winning_bid = bid_result.scalar_one_or_none()

        # Send notifications
        try:
            from app.services.notification_service import (
                notify_auction_won,
                notify_auction_ended_seller,
            )

            had_bids = winning_bid is not None
            final_amount = float(winning_bid.amount) if winning_bid else 0.0

            # Notify winner
            if winning_bid:
                await notify_auction_won(
                    db,
                    winning_bid.bidder_id,
                    listing_id,
                    listing.title,
                    final_amount,
                )

            # Notify seller
            await notify_auction_ended_seller(
                db,
                listing.seller_id,
                listing_id,
                listing.title,
                final_amount,
                had_bids,
            )
        except Exception:
            pass  # Never fail auction end because of notifications

    @staticmethod
    async def check_auction_status(db: AsyncSession, listing_id: str):
        """
        Check if an auction should be ended and end it if so.
        Safe to call repeatedly — exits early if already ended.
        """
        result = await db.execute(
            select(Listing).where(Listing.id == listing_id)
        )
        listing = result.scalar_one_or_none()

        if not listing:
            return

        if (
            listing.status == ListingStatus.ACTIVE
            and datetime.now(timezone.utc) >= listing.auction_end_time
        ):
            await AuctionService.end_auction(db, listing_id)