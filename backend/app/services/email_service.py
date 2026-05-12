from typing import Dict, Any
from app.config import settings

class EmailService:
    """Service for sending emails via Resend"""
    
    @staticmethod
    async def send_verification_email(email: str, verification_token: str) -> Dict[str, Any]:
        # To be implemented with Resend
        pass

    @staticmethod
    async def send_password_reset_email(email: str, reset_token: str) -> Dict[str, Any]:
        # To be implemented with Resend
        pass

    @staticmethod
    async def send_auction_ended_notification(email: str, listing_title: str) -> Dict[str, Any]:
        # To be implemented with Resend
        pass
