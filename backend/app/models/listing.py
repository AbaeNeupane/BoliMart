from sqlalchemy import Column, String, Numeric, DateTime, Boolean, Integer, ForeignKey, Text, func, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)

    listings = relationship("Listing", back_populates="category")

class Listing(Base):
    __tablename__ = "listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    starting_price = Column(Numeric(10, 2), nullable=False)
    current_price = Column(Numeric(10, 2), nullable=True)
    reserve_price = Column(Numeric(10, 2), nullable=True)
    buy_now_price = Column(Numeric(10, 2), nullable=True)
    image_urls = Column(ARRAY(String), default=list)
    bid_count = Column(Integer, default=0)

    status = Column(String, default="active", nullable=False, index=True)  # active, ended, sold, cancelled
    condition = Column(String)  # new, used, refurbished
    location = Column(String)
    shipping_available = Column(Boolean, default=True)
    soft_close_enabled = Column(Boolean, default=True)
    
    starts_at = Column(DateTime(timezone=True), nullable=False)
    auction_end_time = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    seller = relationship("User", back_populates="listings", foreign_keys=[seller_id])
    category = relationship("Category", back_populates="listings")
    bids = relationship("Bid", back_populates="listing", cascade="all, delete-orphan")
    transaction = relationship("Transaction", back_populates="listing", uselist=False)
