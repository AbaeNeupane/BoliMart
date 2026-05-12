from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ListingCreate(BaseModel):
    title: str
    description: str
    starting_price: float
    category_id: Optional[str] = None
    image_urls: Optional[List[str]] = None
    reserve_price: Optional[float] = None
    buy_now_price: Optional[float] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    shipping_available: bool = True
    soft_close_enabled: bool = True
    starts_at: datetime
    auction_end_time: datetime

class ListingResponse(BaseModel):
    id: str
    title: str
    description: str
    starting_price: float
    current_price: Optional[float] = None
    image_urls: List[str]
    status: str
    bid_count: int

    class Config:
        from_attributes = True

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    reserve_price: Optional[float] = None
