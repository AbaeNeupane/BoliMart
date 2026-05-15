from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.listing import Listing
from app.models.transaction import Transaction
from app.models.bid import Bid
from app.schemas.transaction import TransactionResponse, CommissionConfig
from app.core.dependencies import get_current_user
from app.core.constants import UserRole, ListingStatus, TransactionStatus, BidStatus
from app.core.exceptions import NotFoundError, BadRequestError, ForbiddenError
from app.config import settings

router = APIRouter()

def calculate_commission(amount: float, commission_percent: float) -> dict:
    """Calculate commission and seller payout."""
    commission_amount = amount * (commission_percent / 100)
    owner_payout = amount - commission_amount
    return {
        "commission_amount": commission_amount,
        "owner_payout": owner_payout,
    }

@router.post("/connect/onboard")
async def onboard_payout_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get Stripe Connect onboarding link for payouts."""
    if not current_user.stripe_account_id:
        raise BadRequestError("Stripe account not yet created. Please contact support.")
    
    # In production, create Stripe Connect account and return onboarding URL
    return {
        "url": f"{settings.FRONTEND_URL}/stripe-connect",
        "stripe_account_id": current_user.stripe_account_id,
    }

@router.get("/connect/status")
async def stripe_status(current_user: User = Depends(get_current_user)):
    """Get Stripe Connect status for current user."""
    return {
        "connected": bool(current_user.stripe_account_id),
        "stripe_account_id": current_user.stripe_account_id,
    }

@router.post("/checkout/{listing_id}")
async def create_checkout(
    listing_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create Stripe payment intent for auction checkout."""
    # Fetch listing
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing or listing.status != ListingStatus.SOLD:
        raise NotFoundError("Listing is not available for checkout")

    # Check user is winner
    bid_result = await db.execute(
        select(Bid).where(
            Bid.listing_id == listing_id,
            Bid.bidder_id == current_user.id,
            Bid.status == BidStatus.WON
        )
    )
    winning_bid = bid_result.scalar_one_or_none()
    if not winning_bid:
        raise ForbiddenError("You did not win this auction")

    # Check seller has Stripe account
    seller_result = await db.execute(select(User).where(User.id == listing.owner_id))
    seller = seller_result.scalar_one()
    if not seller.stripe_account_id:
        raise BadRequestError("Listing owner has not completed payout setup")

    # Calculate commission
    commission_data = calculate_commission(float(winning_bid.amount), settings.STRIPE_PLATFORM_FEE_PERCENT)

    # Check if transaction already exists
    txn_result = await db.execute(
        select(Transaction).where(Transaction.listing_id == listing_id)
    )
    existing_txn = txn_result.scalar_one_or_none()
    if existing_txn:
        return {
            "client_secret": "existing_payment_intent",  # In production, get actual client secret
            "transaction_id": str(existing_txn.id),
        }

    # Create transaction record
    txn = Transaction(
        listing_id=listing_id,
        bidder_id=current_user.id,
        owner_id=listing.owner_id,
        winning_bid_id=winning_bid.id,
        winning_bid_amount=winning_bid.amount,
        commission_rate=settings.STRIPE_PLATFORM_FEE_PERCENT / 100,
        commission_amount=commission_data["commission_amount"],
        owner_payout=commission_data["owner_payout"],
        stripe_payment_intent_id="pi_placeholder",  # In production, use real Stripe intent
        status=TransactionStatus.PENDING,
    )
    db.add(txn)
    await db.commit()

    return {
        "client_secret": "pi_placeholder_secret",
        "transaction_id": str(txn.id),
    }

@router.get("/transactions")
async def get_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get transactions for current user (as buyer or seller)."""
    query = select(Transaction)
    if current_user.role == UserRole.USER:
        # Users see their purchased and sold items
        from sqlalchemy import or_
        query = query.where(
            or_(
                Transaction.bidder_id == current_user.id,
                Transaction.owner_id == current_user.id,
            )
        )
    result = await db.execute(query.order_by(Transaction.created_at.desc()))
    return result.scalars().all()
