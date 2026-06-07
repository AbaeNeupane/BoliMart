from app.workers.celery_app import celery_app
from sqlalchemy import create_engine, select, and_
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from decimal import Decimal
import os

# Load .env explicitly so Celery workers on Windows pick up DATABASE_URL
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql+psycopg2://"
)


def get_sync_session():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Make sure your .env file exists in the backend "
            "directory and contains a valid DATABASE_URL."
        )
    engine = create_engine(DATABASE_URL)
    return Session(engine)


@celery_app.task(name="app.workers.auction_tasks.close_ended_auctions")
def close_ended_auctions():
    """
    Runs every minute via Celery Beat.
    Finds all active listings whose auction_end_time has passed
    and closes them — marking the winner and creating a transaction record.
    """
    from app.models.listing import Listing
    from app.models.bid import Bid
    from app.models.transaction import Transaction
    from app.core.constants import ListingStatus, BidStatus

    COMMISSION_RATE = Decimal("0.10")  # 10% platform fee

    db = get_sync_session()
    try:
        now = datetime.now(timezone.utc)

        # Find all active listings that have ended
        ended = db.execute(
            select(Listing).where(
                and_(
                    Listing.status == ListingStatus.ACTIVE,
                    Listing.auction_end_time <= now,
                )
            )
        ).scalars().all()

        closed = 0
        for listing in ended:
            # Find winning bid — pick the highest regardless of ACTIVE or OUTBID
            # status to handle edge cases from soft-close or race conditions
            winning_bid = db.execute(
                select(Bid).where(
                    and_(
                        Bid.listing_id == listing.id,
                        Bid.status.in_([BidStatus.ACTIVE, BidStatus.OUTBID]),
                    )
                ).order_by(Bid.amount.desc())
            ).scalars().first()

            if winning_bid:
                # Mark listing as sold
                listing.status = ListingStatus.SOLD

                # Mark winning bid as won
                winning_bid.status = BidStatus.WON
                winning_bid.is_winning = True

                # Mark ALL other bids (ACTIVE or OUTBID) as LOST
                # Bug fix: original code only filtered OUTBID, leaving any
                # remaining ACTIVE bids untouched in the database
                other_bids = db.execute(
                    select(Bid).where(
                        and_(
                            Bid.listing_id == listing.id,
                            Bid.id != winning_bid.id,
                            Bid.status.in_([BidStatus.ACTIVE, BidStatus.OUTBID]),
                        )
                    )
                ).scalars().all()
                for bid in other_bids:
                    bid.status = BidStatus.LOST
                    bid.is_winning = False

                # Create transaction record
                amount = Decimal(str(winning_bid.amount))
                commission = (amount * COMMISSION_RATE).quantize(Decimal("0.01"))
                payout = amount - commission

                existing_tx = db.execute(
                    select(Transaction).where(Transaction.listing_id == listing.id)
                ).scalar_one_or_none()

                if not existing_tx:
                    transaction = Transaction(
                        listing_id=listing.id,
                        bidder_id=winning_bid.bidder_id,
                        user_id=winning_bid.bidder_id,
                        owner_id=listing.seller_id,
                        winning_bid_id=winning_bid.id,
                        amount=amount,
                        commission_rate=COMMISSION_RATE,
                        commission_amount=commission,
                        owner_payout=payout,
                        status="pending",
                        transaction_type="bid_payment",
                    )
                    db.add(transaction)

                # Send winner notification email
                send_winner_email.delay(
                    str(winning_bid.bidder_id),
                    str(listing.id),
                    listing.title,
                    float(winning_bid.amount),
                )

                # Send seller notification email
                send_seller_email.delay(
                    str(listing.seller_id),
                    listing.title,
                    float(winning_bid.amount),
                )

            else:
                # No bids — mark as ended with no sale
                listing.status = ListingStatus.ENDED

            closed += 1

        db.commit()
        return f"Closed {closed} auctions"

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


@celery_app.task(name="app.workers.auction_tasks.end_auction_task")
def end_auction_task(listing_id: str):
    """
    Triggered precisely when a specific auction's timer expires.
    Scheduled via apply_async(countdown=...) at listing creation time.
    This gives exact on-time closure instead of waiting up to 60s for Beat.
    """
    from app.models.listing import Listing
    from app.models.bid import Bid
    from app.models.transaction import Transaction
    from app.core.constants import ListingStatus, BidStatus

    COMMISSION_RATE = Decimal("0.10")

    db = get_sync_session()
    try:
        listing = db.execute(
            select(Listing).where(Listing.id == listing_id)
        ).scalar_one_or_none()

        if not listing:
            return f"Listing {listing_id} not found"

        if listing.status != ListingStatus.ACTIVE:
            return f"Listing {listing_id} is already {listing.status}, skipping"

        # Double-check the time has actually passed (soft-close may have extended it)
        now = datetime.now(timezone.utc)
        end_time = listing.auction_end_time
        if end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)

        if end_time > now:
            # Soft-close extended the auction — reschedule for the new end time
            new_delay = (end_time - now).total_seconds()
            end_auction_task.apply_async(args=[listing_id], countdown=int(new_delay) + 1)
            return f"Auction {listing_id} extended, rescheduled in {int(new_delay)}s"

        # Same closing logic as close_ended_auctions but for a single listing
        winning_bid = db.execute(
            select(Bid).where(
                and_(
                    Bid.listing_id == listing.id,
                    Bid.status.in_([BidStatus.ACTIVE, BidStatus.OUTBID]),
                )
            ).order_by(Bid.amount.desc())
        ).scalars().first()

        if winning_bid:
            listing.status = ListingStatus.SOLD
            winning_bid.status = BidStatus.WON
            winning_bid.is_winning = True

            other_bids = db.execute(
                select(Bid).where(
                    and_(
                        Bid.listing_id == listing.id,
                        Bid.id != winning_bid.id,
                        Bid.status.in_([BidStatus.ACTIVE, BidStatus.OUTBID]),
                    )
                )
            ).scalars().all()
            for bid in other_bids:
                bid.status = BidStatus.LOST
                bid.is_winning = False

            amount = Decimal(str(winning_bid.amount))
            commission = (amount * COMMISSION_RATE).quantize(Decimal("0.01"))
            payout = amount - commission

            existing_tx = db.execute(
                select(Transaction).where(Transaction.listing_id == listing.id)
            ).scalar_one_or_none()

            if not existing_tx:
                transaction = Transaction(
                    listing_id=listing.id,
                    bidder_id=winning_bid.bidder_id,
                    user_id=winning_bid.bidder_id,
                    owner_id=listing.seller_id,
                    winning_bid_id=winning_bid.id,
                    amount=amount,
                    commission_rate=COMMISSION_RATE,
                    commission_amount=commission,
                    owner_payout=payout,
                    status="pending",
                    transaction_type="bid_payment",
                )
                db.add(transaction)

            send_winner_email.delay(
                str(winning_bid.bidder_id),
                str(listing.id),
                listing.title,
                float(winning_bid.amount),
            )
            send_seller_email.delay(
                str(listing.seller_id),
                listing.title,
                float(winning_bid.amount),
            )
        else:
            listing.status = ListingStatus.ENDED

        db.commit()
        return f"Closed listing {listing_id}, status={listing.status}"

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


@celery_app.task(name="app.workers.auction_tasks.send_winner_email")
def send_winner_email(user_id: str, listing_id: str, listing_title: str, amount: float):
    """Send auction won email to the winning bidder."""
    from app.models.user import User

    db = get_sync_session()
    try:
        user = db.execute(
            select(User).where(User.id == user_id)
        ).scalar_one_or_none()

        if not user:
            return

        import resend
        resend.api_key = os.getenv("RESEND_API_KEY", "")

        checkout_url = f"http://localhost:5173/checkout/{listing_id}"

        try:
            resend.Emails.send({
                "from": f"{os.getenv('EMAIL_FROM_NAME', 'Boli')} <{os.getenv('EMAIL_FROM', 'onboarding@resend.dev')}>",
                "to": [user.email],
                "subject": f"🏆 You won: {listing_title}!",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Congratulations, you won! 🎉</h2>
                    <p>Hi {user.full_name},</p>
                    <p>You placed the winning bid of <strong>${amount:.2f}</strong> on <strong>{listing_title}</strong>.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{checkout_url}"
                           style="background-color: #F97316; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;">
                            Complete Checkout
                        </a>
                    </div>
                    <p>Please complete your payment within 48 hours to secure your item.</p>
                </div>
                """
            })
        except Exception as e:
            print(f"Failed to send winner email: {e}")
    finally:
        db.close()


@celery_app.task(name="app.workers.auction_tasks.send_seller_email")
def send_seller_email(seller_id: str, listing_title: str, amount: float):
    """Notify seller their item sold."""
    from app.models.user import User

    COMMISSION_RATE = 0.10
    payout = amount * (1 - COMMISSION_RATE)

    db = get_sync_session()
    try:
        seller = db.execute(
            select(User).where(User.id == seller_id)
        ).scalar_one_or_none()

        if not seller:
            return

        import resend
        resend.api_key = os.getenv("RESEND_API_KEY", "")

        try:
            resend.Emails.send({
                "from": f"{os.getenv('EMAIL_FROM_NAME', 'Boli')} <{os.getenv('EMAIL_FROM', 'onboarding@resend.dev')}>",
                "to": [seller.email],
                "subject": f"✅ Your item sold: {listing_title}",
                "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Your item sold! 🎉</h2>
                    <p>Hi {seller.full_name},</p>
                    <p><strong>{listing_title}</strong> sold for <strong>${amount:.2f}</strong>.</p>
                    <p>After the 10% platform fee, your payout will be <strong>${payout:.2f}</strong>.</p>
                    <p>The buyer has been notified to complete checkout. You'll receive your payout once payment is confirmed.</p>
                </div>
                """
            })
        except Exception as e:
            print(f"Failed to send seller email: {e}")
    finally:
        db.close()