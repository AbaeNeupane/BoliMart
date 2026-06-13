from datetime import timedelta, datetime, timezone
from typing import Any
import secrets
import random
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr, field_validator

from app.database.session import get_db
from app.models.user import User
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    verify_token,
    decode_token,
)
from app.core.email import email_service
from app.core.config import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class EmailCheckRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    username: str
    date_of_birth: str = None
    nationality: str = None

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 3:
            raise ValueError("Username must be at least 3 characters")
        if " " in normalized:
            raise ValueError("Username cannot contain spaces")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        return value

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str = None
    is_verified: bool
    role: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshRequest(BaseModel):
    refresh_token: str

class VerifyEmailRequest(BaseModel):
    token: str


# ---------------------------------------------------------------------------
# Step 1 — Check email availability and send OTP
# ---------------------------------------------------------------------------

@router.post("/register/send-otp")
async def send_otp(request: EmailCheckRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 1 of registration:
    - Validate email not already taken
    - Validate passwords match and meet requirements
    - Generate a 6-digit OTP and store it as the verification token
    - Send OTP email
    """
    if request.password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    result = await db.execute(select(User).where(User.email == request.email))
    existing = result.scalar_one_or_none()

    otp = str(random.randint(100000, 999999))
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)

    if existing:
        if existing.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        # Unverified user from a previous attempt — update their OTP
        existing.email_verification_token = otp
        existing.email_verification_expires = expires
        existing.hashed_password = get_password_hash(request.password)
        await db.commit()
    else:
        # Temp placeholder user — will be completed in step 3
        temp_user = User(
            email=request.email,
            username=f"temp_{secrets.token_hex(8)}",  # placeholder, replaced in step 3
            hashed_password=get_password_hash(request.password),
            full_name="",  # filled in step 3
            email_verification_token=otp,
            email_verification_expires=expires,
            is_verified=False,
            is_active=False,  # not active until step 3 completes
        )
        db.add(temp_user)
        await db.commit()

    # Send OTP email
    result = await email_service.send_otp_email(request.email, otp)
    if not result["success"]:
        print(f"Failed to send OTP: {result['error']}")

    return {"message": "OTP sent to your email", "email": request.email}


# ---------------------------------------------------------------------------
# Step 2 — Verify OTP
# ---------------------------------------------------------------------------

@router.post("/register/verify-otp")
async def verify_otp(request: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 2: User enters the 6-digit OTP from their email.
    On success returns a short-lived session token used to complete step 3.
    """
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Email not found")

    if user.email_verification_token != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    expires = user.email_verification_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")

    # Clear OTP — mark email as verified
    user.email_verification_token = None
    user.email_verification_expires = None
    user.is_verified = True
    await db.commit()

    # Return a temp token so step 3 knows this email was verified
    session_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=30)
    )
    return {"message": "Email verified", "session_token": session_token}


# ---------------------------------------------------------------------------
# Step 3 — Complete profile
# ---------------------------------------------------------------------------

@router.post("/register/complete", response_model=UserResponse)
async def complete_registration(
    data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Step 3: User provides full name, username, DOB, nationality.
    Activates the account and returns user info.
    """
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Email not found")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")

    # Check username not taken by someone else
    result = await db.execute(
        select(User).where(User.username == data.username, User.id != user.id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    user.username = data.username
    user.full_name = data.full_name
    user.date_of_birth = data.date_of_birth
    user.nationality = data.nationality
    user.is_active = True

    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_verified=user.is_verified,
        role=user.role,
    )


# ---------------------------------------------------------------------------
# Legacy single-step register (kept for API compatibility)
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user_data.password)
    verification_token = secrets.token_urlsafe(32)

    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        email_verification_token=verification_token,
        email_verification_expires=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    email_result = await email_service.send_verification_email(user.email, verification_token)
    if not email_result["success"]:
        print(f"Failed to send verification email: {email_result['error']}")

    return UserResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_verified=user.is_verified,
        role=user.role,
    )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(
            (User.username == form_data.username) | (User.email == form_data.username)
        )
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")

    access_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(subject=str(user.id))

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


# ---------------------------------------------------------------------------
# Refresh token
# ---------------------------------------------------------------------------

@router.post("/refresh", response_model=Token)
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active or not user.is_verified:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_access_token(
        subject=user_id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(subject=user_id)

    return Token(access_token=access_token, refresh_token=refresh_token, token_type="bearer")


# ---------------------------------------------------------------------------
# Verify email (link-based, legacy)
# ---------------------------------------------------------------------------

@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email_verification_token == request.token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    expires = user.email_verification_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification token has expired")

    user.is_verified = True
    user.is_active = True
    user.email_verification_token = None
    user.email_verification_expires = None
    await db.commit()

    return {"message": "Email verified successfully"}


# ---------------------------------------------------------------------------
# Resend verification
# ---------------------------------------------------------------------------

@router.post("/resend-verification")
async def resend_verification(email: EmailStr, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    otp = str(random.randint(100000, 999999))
    user.email_verification_token = otp
    user.email_verification_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.commit()

    result = await email_service.send_otp_email(email, otp)
    if not result["success"]:
        raise HTTPException(status_code=500, detail="Failed to send verification email")

    return {"message": "Verification email sent"}


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = verify_token(token)
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    if not user.is_active or not user.is_verified:
        raise HTTPException(status_code=400, detail="Inactive or unverified user")

    return user


async def get_current_active_verified_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    return current_user