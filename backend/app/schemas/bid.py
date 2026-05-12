from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BidCreate(BaseModel):
    amount: float

class BidResponse(BaseModel):
    id: str
    listing_id: str
    bidder_id: str
    amount: float
    status: str
    placed_at: datetime

    class Config:
        from_attributes = True
