from sqlalchemy import Column, String, Boolean, DateTime, Date, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String, default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    email_verification_token = Column(String(500), nullable=True)
    email_verification_expires = Column(DateTime(timezone=True), nullable=True)

    # New profile fields added for multi-step registration
    date_of_birth = Column(String(20), nullable=True)   # stored as string "YYYY-MM-DD"
    nationality = Column(String(100), nullable=True)

    stripe_customer_id = Column(String(255), nullable=True)
    stripe_account_id = Column(String(255), nullable=True)
    push_token = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    listings = relationship("Listing", back_populates="seller", foreign_keys="Listing.seller_id")
    bids = relationship("Bid", back_populates="bidder")
    transactions = relationship("Transaction", back_populates="user", foreign_keys="Transaction.user_id")