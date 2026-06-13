from sqlalchemy import Column, String, DateTime, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class WebhookEvent(Base):
    """Track processed webhook events for idempotency."""
    
    __tablename__ = "webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stripe_event_id = Column(String(255), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)  # e.g., payment_intent.succeeded
    
    # Processing status
    processed = Column(Boolean, default=False, nullable=False, index=True)
    success = Column(Boolean, nullable=True)  # True if successful, False if failed, None if not yet processed
    error_message = Column(String(500), nullable=True)
    
    # Metadata for debugging
    event_metadata = Column("metadata", String, nullable=True)  # JSON stringified metadata from event
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
