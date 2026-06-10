from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

class BidCreate(BaseModel):
    listing_id: UUID
    amount: float

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Bid amount must be greater than zero")
        return v

class BidResponse(BaseModel):
    id: UUID
    listing_id: UUID
    bidder_id: UUID
    amount: float
    status: str
    is_winning: bool = False
    placed_at: datetime

    class Config:
        from_attributes = True