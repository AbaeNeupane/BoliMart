from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models.user import User
from app.models.listing import Listing
from app.models.transaction import Transaction
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.transaction import TransactionResponse, CommissionConfig
from app.core.dependencies import get_current_user
from app.core.constants import UserRole, TransactionStatus
from app.config import settings

router = APIRouter()

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get platform statistics (admin only)."""
    user_count = await db.scalar(select(func.count(User.id)))
    listing_count = await db.scalar(
        select(func.count(Listing.id)).where(Listing.status == "active")
    )
    txn_count = await db.scalar(select(func.count(Transaction.id)))
    total_commission = await db.scalar(
        select(func.sum(Transaction.commission_amount))
        .where(Transaction.status == TransactionStatus.PAID_OUT)
    )
    
    return {
        "total_users": user_count or 0,
        "active_listings": listing_count or 0,
        "total_transactions": txn_count or 0,
        "total_commission": float(total_commission or 0),
        "commission_rate": settings.STRIPE_PLATFORM_FEE_PERCENT,
    }

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all users (admin only)."""
    result = await db.execute(
        select(User)
        .offset((page - 1) * limit)
        .limit(limit)
        .order_by(User.created_at.desc())
    )
    return result.scalars().all()

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    for field, value in user_in.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/transactions", response_model=List[TransactionResponse])
async def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all transactions (admin only)."""
    result = await db.execute(
        select(Transaction)
        .offset((page - 1) * limit)
        .limit(limit)
        .order_by(Transaction.created_at.desc())
    )
    return result.scalars().all()

@router.patch("/settings/commission")
async def update_commission(
    config: CommissionConfig,
    current_user: User = Depends(require_admin),
):
    """Update commission rate (admin only)."""
    if not (0 <= config.commission_percent <= 100):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Commission must be 0–100"
        )
    
    # In production, store this in the DB or a settings table
    # For now, this is a placeholder
    settings.STRIPE_PLATFORM_FEE_PERCENT = config.commission_percent
    
    return {"commission_percent": config.commission_percent}
