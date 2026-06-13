from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime, timezone

VALID_CONDITIONS = {"new", "used", "refurbished"}


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
    condition: Optional[str] = None
    location: Optional[str] = None
    shipping_available: bool = True
    soft_close_enabled: bool = True
    starts_at: datetime
    auction_end_time: datetime

    @field_validator("title")
    @classmethod
    def title_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("Title must be at least 5 characters")
        if len(v) > 200:
            raise ValueError("Title must not exceed 200 characters")
        return v

    @field_validator("description")
    @classmethod
    def description_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 20:
            raise ValueError("Description must be at least 20 characters")
        if len(v) > 5000:
            raise ValueError("Description must not exceed 5000 characters")
        return v

    @field_validator("starting_price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Starting price must be greater than zero")
        if v > 999999.99:
            raise ValueError("Starting price exceeds maximum allowed")
        return v

    @field_validator("reserve_price")
    @classmethod
    def validate_reserve_price(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("Reserve price must be greater than zero")
        if v > 999999.99:
            raise ValueError("Reserve price exceeds maximum allowed")
        return v

    @field_validator("buy_now_price")
    @classmethod
    def validate_buy_now_price(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("Buy-now price must be greater than zero")
        if v > 999999.99:
            raise ValueError("Buy-now price exceeds maximum allowed")
        return v

    @field_validator("condition")
    @classmethod
    def validate_condition(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in VALID_CONDITIONS:
            raise ValueError(f"Condition must be one of: {', '.join(VALID_CONDITIONS)}")
        return v

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) > 500:
            raise ValueError("Location must not exceed 500 characters")
        return v

    @model_validator(mode="after")
    def validate_prices(self) -> "ListingCreate":
        if self.reserve_price and self.reserve_price < self.starting_price:
            raise ValueError("Reserve price must be >= starting price")
        if self.buy_now_price and self.buy_now_price < self.starting_price:
            raise ValueError("Buy-now price must be >= starting price")
        return self

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
