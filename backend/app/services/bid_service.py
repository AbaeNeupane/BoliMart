from sqlalchemy.ext.asyncio import AsyncSession
from app.models.bid import Bid
from sqlalchemy import select

class BidService:
    @staticmethod
    async def place_bid(db: AsyncSession, **kwargs) -> Bid:
        bid = Bid(**kwargs)
        db.add(bid)
        await db.commit()
        await db.refresh(bid)
        return bid

    @staticmethod
    async def get_bid(db: AsyncSession, bid_id: str) -> Bid | None:
        result = await db.execute(select(Bid).where(Bid.id == bid_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_listing_bids(db: AsyncSession, listing_id: str):
        result = await db.execute(
            select(Bid)
            .where(Bid.listing_id == listing_id)
            .order_by(Bid.amount.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_highest_bid(db: AsyncSession, listing_id: str) -> Bid | None:
        result = await db.execute(
            select(Bid)
            .where(Bid.listing_id == listing_id)
            .order_by(Bid.amount.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
