"""
Notification service — call these after bid/auction events.
All functions are async and accept an active db session.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification


async def notify_outbid(db: AsyncSession, user_id, listing_id, listing_title: str, new_amount: float):
    notif = Notification(
        user_id=user_id,
        type="outbid",
        title="You've been outbid!",
        message=f'Someone placed a higher bid of ${new_amount:,.2f} on "{listing_title}". Bid again to stay in the lead.',
        listing_id=listing_id,
    )
    db.add(notif)
    await db.commit()


async def notify_auction_won(db: AsyncSession, user_id, listing_id, listing_title: str, final_amount: float):
    notif = Notification(
        user_id=user_id,
        type="auction_won",
        title="🎉 You won the auction!",
        message=f'Congratulations! You won "{listing_title}" with a bid of ${final_amount:,.2f}. Complete checkout to claim your item.',
        listing_id=listing_id,
    )
    db.add(notif)
    await db.commit()


async def notify_auction_ended_seller(db: AsyncSession, user_id, listing_id, listing_title: str, final_amount: float, had_bids: bool):
    if had_bids:
        msg = f'Your auction "{listing_title}" has ended. Winning bid: ${final_amount:,.2f}.'
    else:
        msg = f'Your auction "{listing_title}" ended with no bids.'
    notif = Notification(
        user_id=user_id,
        type="auction_ended",
        title="Your auction has ended",
        message=msg,
        listing_id=listing_id,
    )
    db.add(notif)
    await db.commit()


async def notify_new_bid_seller(db: AsyncSession, user_id, listing_id, listing_title: str, amount: float):
    notif = Notification(
        user_id=user_id,
        type="new_bid",
        title="New bid on your listing",
        message=f'Someone placed a bid of ${amount:,.2f} on your listing "{listing_title}".',
        listing_id=listing_id,
    )
    db.add(notif)
    await db.commit()


async def notify_bid_cancelled(db: AsyncSession, user_id, listing_id, listing_title: str):
    notif = Notification(
        user_id=user_id,
        type="bid_cancelled",
        title="Your bid was cancelled",
        message=f'Your bid on "{listing_title}" has been cancelled successfully.',
        listing_id=listing_id,
    )
    db.add(notif)
    await db.commit()