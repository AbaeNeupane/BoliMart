from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from uuid import UUID
import stripe

from app.database import get_db
from app.models.user import User
from app.models.listing import Listing
from app.models.transaction import Transaction
from app.models.bid import Bid
from app.core.dependencies import get_current_user
from app.core.constants import UserRole, ListingStatus, TransactionStatus, BidStatus
from app.core.exceptions import NotFoundError, BadRequestError, ForbiddenError
from app.core.config import settings

router = APIRouter()


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
        # Create a Stripe Connect Express account if user doesn't have one yet
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

        # Create onboarding link
        account_link = s.AccountLink.create(
            account=current_user.stripe_account_id,
            refresh_url=f"{settings.FRONTEND_URL}/dashboard?stripe=refresh",
            return_url=f"{settings.FRONTEND_URL}/dashboard?stripe=success",
            type="account_onboarding",
        )

        return {"url": account_link.url, "stripe_account_id": current_user.stripe_account_id}

    except Exception as e:
        print(f"STRIPE ERROR: {e}")
    raise BadRequestError(f"Stripe error: {str(e)}")


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
        s = get_stripe()
        account = s.Account.retrieve(current_user.stripe_account_id)
        connected = (
            account.get("charges_enabled", False)
            and account.get("payouts_enabled", False)
        )
        return {
            "connected": connected,
            "stripe_account_id": current_user.stripe_account_id,
            "charges_enabled": account.get("charges_enabled"),
            "payouts_enabled": account.get("payouts_enabled"),
        }
    except Exception:
        return {"connected": False, "stripe_account_id": current_user.stripe_account_id}


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
# POST /payments/webhook — Stripe webhook handler
# ---------------------------------------------------------------------------
@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        s = get_stripe()
        event = s.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        listing_id = intent["metadata"].get("listing_id")
        if listing_id:
            result = await db.execute(
                select(Transaction).where(
                    Transaction.stripe_payment_intent_id == intent["id"]
                )
            )
            txn = result.scalar_one_or_none()
            if txn:
                txn.status = TransactionStatus.CAPTURED
                from datetime import datetime, timezone
                txn.paid_at = datetime.now(timezone.utc)
                await db.commit()

    return {"status": "ok"}


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