from pydantic import BaseModel
from datetime import datetime

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
