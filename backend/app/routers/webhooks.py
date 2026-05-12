from fastapi import APIRouter

router = APIRouter()

@router.post("/stripe")
async def handle_stripe_webhook():
    return {"message": "Stripe webhook - to be implemented"}

@router.post("/payment-status")
async def handle_payment_status():
    return {"message": "Payment status webhook - to be implemented"}
