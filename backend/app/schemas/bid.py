from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class BidCreate(BaseModel):
    listing_id: UUID
    amount: float

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