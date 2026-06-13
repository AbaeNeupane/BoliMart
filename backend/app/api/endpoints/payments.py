from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from uuid import UUID
import stripe
import json
import logging
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User
from app.models.listing import Listing
from app.models.transaction import Transaction
from app.models.webhook_event import WebhookEvent
from app.models.bid import Bid
from app.core.dependencies import get_current_user
from app.core.constants import UserRole, ListingStatus, TransactionStatus, BidStatus
from app.core.exceptions import NotFoundError, BadRequestError, ForbiddenError
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


def get_stripe():
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def calculate_commission(amount: float, commission_percent: float) -> dict:
    commission_amount = round(amount * (commission_percent / 100), 2)
    owner_payout = round(amount - commission_amount, 2)
    return {"commission_amount": commission_amount, "owner_payout": owner_payout}


# ---------------------------------------------------------------------------
# POST /payments/connect/onboard — create Stripe Connect account + get link
# ---------------------------------------------------------------------------
@router.post("/connect/onboard")
async def onboard_payout_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = get_stripe()
    try:
        # If stored account doesn't exist on Stripe, clear it and create new one
        if current_user.stripe_account_id:
            try:
                s.Account.retrieve(current_user.stripe_account_id)
            except Exception:
                # Account not found — clear it so we create a new one
                current_user.stripe_account_id = None
                await db.commit()

        if not current_user.stripe_account_id:
            account = s.Account.create(
                type="express",
                email=current_user.email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            current_user.stripe_account_id = account.id
            await db.commit()

        account_link = s.AccountLink.create(
            account=current_user.stripe_account_id,
            refresh_url=f"{settings.FRONTEND_URL}/dashboard?stripe=refresh",
            return_url=f"{settings.FRONTEND_URL}/dashboard?stripe=success",
            type="account_onboarding",
        )
        return {"url": account_link.url, "stripe_account_id": current_user.stripe_account_id}

    except Exception as err:
        print(f"STRIPE ERROR: {err}")
        raise BadRequestError(f"Stripe error: {str(err)}")
    
# ---------------------------------------------------------------------------
# GET /payments/connect/status
# ---------------------------------------------------------------------------
@router.get("/connect/status")
async def stripe_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.stripe_account_id:
        return {"connected": False, "stripe_account_id": None}

    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        account = stripe.Account.retrieve(current_user.stripe_account_id)
        print(f"STRIPE ACCOUNT: charges={account.charges_enabled} payouts={account.payouts_enabled}")
        connected = bool(account.charges_enabled and account.payouts_enabled)
        return {
            "connected": connected,
            "stripe_account_id": current_user.stripe_account_id,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
        }
    except Exception as e:
        print(f"STRIPE STATUS ERROR: {e}")
        return {"connected": False, "stripe_account_id": current_user.stripe_account_id}
    
@router.post("/connect/login")
async def connect_login(
    current_user: User = Depends(get_current_user),
):
    if not current_user.stripe_account_id:
        raise BadRequestError("No Stripe account connected")
    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        login_link = stripe.Account.create_login_link(current_user.stripe_account_id)
        return {"url": login_link.url}
    except Exception as e:
        raise BadRequestError(f"Stripe error: {str(e)}")

# ---------------------------------------------------------------------------
# POST /payments/checkout/{listing_id} — create payment intent
# ---------------------------------------------------------------------------
@router.post("/checkout/{listing_id}")
async def create_checkout(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing or listing.status != ListingStatus.SOLD:
        raise NotFoundError("Listing is not available for checkout")

    bid_result = await db.execute(
        select(Bid).where(
            Bid.listing_id == listing_id,
            Bid.bidder_id == current_user.id,
            Bid.status == BidStatus.WON,
        )
    )
    winning_bid = bid_result.scalar_one_or_none()
    if not winning_bid:
        raise ForbiddenError("You did not win this auction")

    seller_result = await db.execute(select(User).where(User.id == listing.seller_id))
    seller = seller_result.scalar_one()
    if not seller.stripe_account_id:
        raise BadRequestError("Seller has not completed payout setup")

    # Check for existing transaction
    txn_result = await db.execute(
        select(Transaction).where(Transaction.listing_id == listing_id)
    )
    existing_txn = txn_result.scalar_one_or_none()
    if existing_txn and existing_txn.stripe_payment_intent_id:
        try:
            s = get_stripe()
            intent = s.PaymentIntent.retrieve(existing_txn.stripe_payment_intent_id)
            return {
                "client_secret": intent.client_secret,
                "transaction_id": str(existing_txn.id),
                "amount": float(existing_txn.amount),
            }
        except Exception:
            pass

    commission_data = calculate_commission(
        float(winning_bid.amount),
        float(settings.STRIPE_PLATFORM_FEE_PERCENT),
    )
    amount_cents = int(float(winning_bid.amount) * 100)
    commission_cents = int(commission_data["commission_amount"] * 100)

    try:
        s = get_stripe()
        intent = s.PaymentIntent.create(
            amount=amount_cents,
            currency="usd",
            application_fee_amount=commission_cents,
            transfer_data={"destination": seller.stripe_account_id},
            metadata={
                "listing_id": str(listing_id),
                "buyer_id": str(current_user.id),
                "seller_id": str(listing.seller_id),
            },
        )
    except s.error.StripeError as e:
        raise BadRequestError(f"Stripe error: {e.user_message or str(e)}")

    if existing_txn:
        existing_txn.stripe_payment_intent_id = intent.id
        await db.commit()
        return {
            "client_secret": intent.client_secret,
            "transaction_id": str(existing_txn.id),
            "amount": float(winning_bid.amount),
        }

    txn = Transaction(
        listing_id=listing_id,
        bidder_id=current_user.id,
        user_id=current_user.id,
        owner_id=listing.seller_id,
        winning_bid_id=winning_bid.id,
        amount=winning_bid.amount,
        commission_rate=float(settings.STRIPE_PLATFORM_FEE_PERCENT) / 100,
        commission_amount=commission_data["commission_amount"],
        owner_payout=commission_data["owner_payout"],
        stripe_payment_intent_id=intent.id,
        status=TransactionStatus.PENDING,
        transaction_type="bid_payment",
    )
    db.add(txn)
    await db.commit()

    return {
        "client_secret": intent.client_secret,
        "transaction_id": str(txn.id),
        "amount": float(winning_bid.amount),
    }


# ---------------------------------------------------------------------------
# POST /payments/webhook — Stripe webhook handler with idempotency
# ---------------------------------------------------------------------------
@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error("Stripe webhook secret not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe webhook secret is not configured"
        )

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        logger.warning("Missing Stripe signature header")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature header"
        )

    try:
        s = get_stripe()
        event = s.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError as e:
        logger.warning(f"Invalid Stripe webhook signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature"
        )
    except Exception as e:
        logger.error(f"Webhook parsing error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    event_id = event.get("id")
    event_type = event.get("type")

    # Check for duplicate/idempotency
    try:
        webhook_result = await db.execute(
            select(WebhookEvent).where(WebhookEvent.stripe_event_id == event_id)
        )
        existing_webhook = webhook_result.scalar_one_or_none()

        if existing_webhook:
            logger.info(f"Webhook {event_id} already processed (type={event_type})")
            return {"status": "ok", "already_processed": True}

        # Create a record for this webhook event
        webhook_event = WebhookEvent(
            stripe_event_id=event_id,
            event_type=event_type,
            metadata=json.dumps(event.get("data", {}))
        )
        db.add(webhook_event)
        await db.commit()
        await db.refresh(webhook_event)

    except Exception as e:
        logger.error(f"Error checking webhook idempotency: {e}")
        # Don't fail the request, but log the error
        webhook_event = None

    # Process the event
    try:
        if event_type == "payment_intent.succeeded":
            await handle_payment_intent_succeeded(event, db, webhook_event)
        elif event_type == "charge.refunded":
            await handle_charge_refunded(event, db, webhook_event)
        # Add more event handlers as needed

        # Mark webhook as successfully processed
        if webhook_event:
            webhook_event.processed = True
            webhook_event.success = True
            webhook_event.processed_at = datetime.now(timezone.utc)
            await db.commit()

    except Exception as e:
        logger.error(f"Error processing webhook {event_id}: {e}")
        # Mark webhook as failed
        if webhook_event:
            webhook_event.processed = True
            webhook_event.success = False
            webhook_event.error_message = str(e)[:500]
            webhook_event.processed_at = datetime.now(timezone.utc)
            await db.commit()
        # Return 200 OK to acknowledge receipt and avoid Stripe retries of a broken handler
        return {"status": "error", "message": str(e)}

    return {"status": "ok"}


async def handle_payment_intent_succeeded(event: dict, db: AsyncSession, webhook_event: WebhookEvent = None) -> None:
    """Handle payment_intent.succeeded event with error handling and retry logic."""
    intent = event["data"]["object"]
    intent_id = intent.get("id")
    listing_id = intent.get("metadata", {}).get("listing_id")

    if not listing_id:
        logger.warning(f"Payment intent {intent_id} has no listing_id in metadata")
        return

    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = await db.execute(
                select(Transaction).where(
                    Transaction.stripe_payment_intent_id == intent_id
                )
            )
            txn = result.scalar_one_or_none()

            if not txn:
                logger.warning(f"No transaction found for payment intent {intent_id}")
                return

            # Skip if already captured
            if txn.status == TransactionStatus.CAPTURED:
                logger.info(f"Transaction {txn.id} already captured, skipping")
                return

            # Update transaction status
            txn.status = TransactionStatus.CAPTURED
            txn.paid_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(f"Successfully marked transaction {txn.id} as captured")
            return

        except Exception as e:
            if attempt < max_retries - 1:
                logger.warning(f"Attempt {attempt + 1} to handle payment intent failed: {e}, retrying...")
                continue
            else:
                logger.error(f"Failed to handle payment intent {intent_id} after {max_retries} attempts: {e}")
                raise


async def handle_charge_refunded(event: dict, db: AsyncSession, webhook_event: WebhookEvent = None) -> None:
    """Handle charge.refunded event to update transaction status."""
    charge = event["data"]["object"]
    charge_id = charge.get("id")

    try:
        # Find transaction by payment intent id (charges don't have direct transaction association)
        payment_intent_id = charge.get("payment_intent")
        if not payment_intent_id:
            logger.warning(f"Refund charge {charge_id} has no payment_intent")
            return

        result = await db.execute(
            select(Transaction).where(
                Transaction.stripe_payment_intent_id == payment_intent_id
            )
        )
        txn = result.scalar_one_or_none()

        if txn:
            txn.status = TransactionStatus.REFUNDED
            await db.commit()
            logger.info(f"Marked transaction {txn.id} as refunded")

    except Exception as e:
        logger.error(f"Error handling refund for charge {charge_id}: {e}")
        raise


# ---------------------------------------------------------------------------
# GET /payments/transactions
# ---------------------------------------------------------------------------
@router.get("/transactions")
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Transaction)
    if current_user.role != UserRole.ADMIN:
        query = query.where(
            or_(
                Transaction.bidder_id == current_user.id,
                Transaction.owner_id == current_user.id,
            )
        )
    result = await db.execute(query.order_by(Transaction.created_at.desc()))
    return result.scalars().all()