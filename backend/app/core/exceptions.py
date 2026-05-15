from fastapi import HTTPException, status

class NotFoundError(HTTPException):
    def __init__(self, detail: str = "Not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

class BadRequestError(HTTPException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class ConflictError(HTTPException):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)

# Legacy exception aliases for backward compatibility
class AuctionException(HTTPException):
    pass

class UserNotFound(NotFoundError):
    def __init__(self):
        super().__init__("User not found")

class ListingNotFound(NotFoundError):
    def __init__(self):
        super().__init__("Listing not found")

class InvalidBid(BadRequestError):
    def __init__(self, detail: str = "Invalid bid"):
        super().__init__(detail)
    def __init__(self, message: str = "Invalid bid amount"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

class AuctionEnded(AuctionException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auction has ended"
        )

class UnauthorizedError(AuctionException):
    def __init__(self, message: str = "Not authorized"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )

class StripeError(AuctionException):
    def __init__(self, message: str = "Stripe payment error"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
