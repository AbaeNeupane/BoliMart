from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from uuid import UUID

class TransactionCreate(BaseModel):
    listing_id: str
    bidder_id: str
    amount: float

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Transaction amount must be greater than zero")
        if v > 999999.99:
            raise ValueError("Transaction amount exceeds maximum allowed")
        return v

class TransactionResponse(BaseModel):
    id: str
    listing_id: str
    status: str
    amount: float
    commission_amount: float
    owner_payout: float
    created_at: datetime

    class Config:
        from_attributes = True

class CommissionConfig(BaseModel):
    commission_percent: float  # 0–100

    @field_validator("commission_percent")
    @classmethod
    def validate_commission(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("Commission percent must be between 0 and 100")
        return v
