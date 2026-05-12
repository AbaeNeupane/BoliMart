from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, UUID, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)
    email_verification_expires = Column(DateTime, nullable=True)
    role = Column(String, default="user")  # admin, user
    stripe_customer_id = Column(String, nullable=True)
    stripe_account_id = Column(String, nullable=True)  # For sellers
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    listings = relationship("Listing", back_populates="seller")
    bids = relationship("Bid", back_populates="bidder")
    transactions = relationship("Transaction", back_populates="user")

class Listing(Base):
    __tablename__ = "listings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    starting_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    reserve_price = Column(Float, nullable=True)
    buy_now_price = Column(Float, nullable=True)
    category = Column(String)
    condition = Column(String)  # new, used, refurbished
    location = Column(String)
    shipping_available = Column(Boolean, default=True)
    auction_end_time = Column(DateTime, nullable=False)
    status = Column(String, default="active")  # active, ended, cancelled
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    image_urls = Column(Text)  # JSON string of image URLs
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    seller = relationship("User", back_populates="listings")
    bids = relationship("Bid", back_populates="listing", order_by="Bid.created_at.desc()")

class Bid(Base):
    __tablename__ = "bids"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = Column(Float, nullable=False)
    bidder_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("listings.id"), nullable=False)
    is_winning = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    bidder = relationship("User", back_populates="bids")
    listing = relationship("Listing", back_populates="bids")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = Column(Float, nullable=False)
    fee = Column(Float, default=0.0)
    status = Column(String, default="pending")  # pending, completed, failed, refunded
    payment_intent_id = Column(String, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("listings.id"), nullable=True)
    transaction_type = Column(String)  # bid_payment, listing_fee, payout
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="transactions")