from sqlalchemy import Column, Numeric, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("listings.id"), nullable=False, unique=True, index=True)
    bidder_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    winning_bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id"), nullable=False)

    amount = Column(Numeric(10, 2), nullable=False)
    fee = Column(Numeric(10, 2), default=0.0)
    commission_rate = Column(Numeric(5, 4), nullable=False)   # e.g. 0.1000 = 10%
    commission_amount = Column(Numeric(10, 2), nullable=False)
    owner_payout = Column(Numeric(10, 2), nullable=False)

    stripe_payment_intent_id = Column(String(255), nullable=True)
    stripe_transfer_id = Column(String(255), nullable=True)
    status = Column(String, default="pending", nullable=False, index=True)  # pending, captured, paid_out, failed, refunded
    transaction_type = Column(String)  # bid_payment, listing_fee, payout

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)
    paid_out_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    listing = relationship("Listing", back_populates="transaction")
    bidder = relationship("User", foreign_keys=[bidder_id])
    seller = relationship("User", foreign_keys=[owner_id])
    user = relationship("User", foreign_keys=[user_id])
