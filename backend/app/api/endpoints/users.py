from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/me")
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pending_payout_setup = False

    if not current_user.stripe_account_id:
        tx_result = await db.execute(
            select(Transaction).where(
                Transaction.owner_id == current_user.id
            )
        )

        pending_payout_setup = tx_result.scalar_one_or_none() is not None

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "is_verified": current_user.is_verified,
        "role": current_user.role,
        "stripe_account_id": current_user.stripe_account_id,
        "requires_payout_setup": pending_payout_setup,
    }