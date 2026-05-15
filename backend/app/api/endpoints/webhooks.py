from fastapi import APIRouter, Request, HTTPException, Header, status
from typing import Optional
from app.config import settings

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="stripe-signature"),
):
    """Handle Stripe webhook events."""
    payload = await request.body()

    # In production, verify signature and process webhook
    # For now, just acknowledge receipt
    
    try:
        # Stripe signature verification would go here
        # import stripe
        # stripe.api_key = settings.STRIPE_SECRET_KEY
        # event = stripe.Webhook.construct_event(
        #     payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        # )
        
        # Parse event
        import json
        event_data = json.loads(payload) if payload else {}
        event_type = event_data.get("type", "")
        
        if event_type == "payment_intent.succeeded":
            # Handle successful payment
            # In production: capture transaction, notify users
            pass
        elif event_type == "payment_intent.payment_failed":
            # Handle failed payment
            # In production: mark transaction as failed
            pass
        
        return {"received": True}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
