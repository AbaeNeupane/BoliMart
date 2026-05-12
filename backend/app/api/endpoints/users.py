from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.models import User
from app.api.endpoints.auth import get_current_user, UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_verified=current_user.is_verified,
        role=current_user.role
    )

@router.get("/verification-status")
async def get_verification_status(current_user: User = Depends(get_current_user)):
    return {
        "is_verified": current_user.is_verified,
        "email": current_user.email
    }