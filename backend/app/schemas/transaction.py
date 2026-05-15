from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class TransactionCreate(BaseModel):
    listing_id: str
    bidder_id: str
    amount: float

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
