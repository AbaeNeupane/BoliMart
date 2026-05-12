from typing import Dict, Any
from app.config import settings

class CommissionService:
    """Service for calculating commissions and fees"""
    
    @staticmethod
    def calculate_commission(amount: float) -> Dict[str, float]:
        """Calculate commission based on the winning bid amount"""
        commission_rate = settings.STRIPE_PLATFORM_FEE_PERCENT / 100
        commission_amount = amount * commission_rate
        seller_payout = amount - commission_amount
        
        return {
            "commission_rate": commission_rate,
            "commission_amount": commission_amount,
            "seller_payout": seller_payout
        }
