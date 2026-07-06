from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.user import UserUpdate
from app.core.dependencies import get_current_user
from app.core.security import verify_password, get_password_hash

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


@router.patch("/me")
async def update_profile(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Update full name
    if data.full_name is not None:
        current_user.full_name = data.full_name

    # Update username — check uniqueness
    if data.username is not None and data.username != current_user.username:
        existing = await db.execute(
            select(User).where(User.username == data.username)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = data.username

    # Update password — requires current password verification
    if data.new_password is not None:
        if not data.current_password:
            raise HTTPException(
                status_code=400,
                detail="Current password is required to set a new password"
            )
        if not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        current_user.hashed_password = get_password_hash(data.new_password)

    await db.commit()
    await db.refresh(current_user)

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "is_verified": current_user.is_verified,
        "role": current_user.role,
    }