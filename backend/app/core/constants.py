from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class ListingStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ENDED = "ended"      # no bids
    SOLD = "sold"        # winner exists
    CANCELLED = "cancelled"

class BidStatus(str, Enum):
    ACTIVE = "active"    # current highest bid
    OUTBID = "outbid"
    WON = "won"
    LOST = "lost"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    CAPTURED = "captured"
    PAID_OUT = "paid_out"
    FAILED = "failed"
    REFUNDED = "refunded"
