from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime, timezone


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str

    class Config:
        from_attributes = True


class SellerSummary(BaseModel):
    id: str
    username: str
    full_name: str

    class Config:
        from_attributes = True


class ListingCreate(BaseModel):
    title: str
    description: str
    starting_price: float
    category_id: Optional[str] = None
    image_urls: Optional[List[str]] = []
    reserve_price: Optional[float] = None
    buy_now_price: Optional[float] = None
    condition: Optional[str] = None          # new, used, refurbished
    location: Optional[str] = None
    shipping_available: bool = True
    soft_close_enabled: bool = True
    starts_at: datetime
    auction_end_time: datetime

    @field_validator("starting_price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Starting price must be greater than zero")
        return v

    @model_validator(mode="after")
    def end_must_be_after_start(self) -> "ListingCreate":
        if self.auction_end_time <= self.starts_at:
            raise ValueError("auction_end_time must be after starts_at")
        return self


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_urls: Optional[List[str]] = None
    reserve_price: Optional[float] = None
    buy_now_price: Optional[float] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    shipping_available: Optional[bool] = None
    soft_close_enabled: Optional[bool] = None
    # starting_price and times cannot change after creation


class ListingResponse(BaseModel):
    id: str
    title: str
    description: str
    starting_price: float
    current_price: Optional[float] = None
    reserve_price: Optional[float] = None
    buy_now_price: Optional[float] = None
    image_urls: List[str]
    status: str
    bid_count: int
    condition: Optional[str] = None
    location: Optional[str] = None
    shipping_available: bool
    soft_close_enabled: bool
    starts_at: datetime
    auction_end_time: datetime
    created_at: datetime

    seller_id: str
    seller: Optional[SellerSummary] = None
    category_id: Optional[str] = None
    category: Optional[CategoryResponse] = None

    is_active: bool = False
    time_remaining_seconds: Optional[int] = None

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def compute_derived(self) -> "ListingResponse":
        now = datetime.now(timezone.utc)
        end = self.auction_end_time
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        self.is_active = self.status == "active" and end > now
        self.time_remaining_seconds = max(0, int((end - now).total_seconds()))
        return self


class ListingListResponse(BaseModel):
    items: List[ListingResponse]
    total: int
    page: int
    page_size: int
    pages: int
