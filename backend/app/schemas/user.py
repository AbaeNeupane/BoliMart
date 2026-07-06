from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(normalized) > 50:
            raise ValueError("Username must not exceed 50 characters")
        if " " in normalized:
            raise ValueError("Username cannot contain spaces")
        return normalized

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(value) > 200:
            raise ValueError("Password must not exceed 200 characters")
        return value

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        v = value.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if len(v) > 200:
            raise ValueError("Full name must not exceed 200 characters")
        return v

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    is_verified: bool
    role: str

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name_update(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        v = value.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if len(v) > 200:
            raise ValueError("Full name must not exceed 200 characters")
        return v

    @field_validator("username")
    @classmethod
    def validate_username_update(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        v = value.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 50:
            raise ValueError("Username must not exceed 50 characters")
        if " " in v:
            raise ValueError("Username cannot contain spaces")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(value) > 200:
            raise ValueError("Password must not exceed 200 characters")
        return value