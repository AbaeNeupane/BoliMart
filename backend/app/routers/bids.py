from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class BidCreate(BaseModel):
    amount: float

class BidResponse(BaseModel):
    id: str
    listing_id: str
    bidder_id: str
    amount: float
    created_at: str

    class Config:
        from_attributes = True

@router.get("/{listing_id}")
async def get_listing_bids(listing_id: str):
    return {"message": f"Get bids for listing {listing_id} - to be implemented"}

@router.post("/{listing_id}")
async def place_bid(listing_id: str, bid: BidCreate):
    return {"message": f"Place bid on listing {listing_id} - to be implemented"}
