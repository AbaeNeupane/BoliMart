from fastapi import HTTPException, status

class AuctionException(HTTPException):
    pass

class UserNotFound(AuctionException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

class ListingNotFound(AuctionException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )

class InvalidBid(AuctionException):
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
