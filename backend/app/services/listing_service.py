from sqlalchemy.ext.asyncio import AsyncSession
from app.models.listing import Listing
from sqlalchemy import select

class ListingService:
    @staticmethod
    async def create_listing(db: AsyncSession, **kwargs) -> Listing:
        listing = Listing(**kwargs)
        db.add(listing)
        await db.commit()
        await db.refresh(listing)
        return listing

    @staticmethod
    async def get_listing(db: AsyncSession, listing_id: str) -> Listing | None:
        result = await db.execute(select(Listing).where(Listing.id == listing_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_listings(db: AsyncSession, skip: int = 0, limit: int = 10):
        result = await db.execute(select(Listing).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def update_listing(db: AsyncSession, listing_id: str, **kwargs) -> Listing | None:
        listing = await ListingService.get_listing(db, listing_id)
        if listing:
            for key, value in kwargs.items():
                setattr(listing, key, value)
            await db.commit()
            await db.refresh(listing)
        return listing

    @staticmethod
    async def delete_listing(db: AsyncSession, listing_id: str) -> bool:
        listing = await ListingService.get_listing(db, listing_id)
        if listing:
            await db.delete(listing)
            await db.commit()
            return True
        return False
