from fastapi import APIRouter, Request, HTTPException, Header, status
import stripe
from app.config import settings

router = APIRouter()

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(None, alias="stripe-signature"),
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe webhook secret is not configured"
        )

    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature header"
        )

    payload = await request.body()

    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )

        event_type = event.get("type", "")
        if event_type == "payment_intent.succeeded":
            # TODO: process successful payment event in production
            pass
        elif event_type == "payment_intent.payment_failed":
            # TODO: process failed payment event in production
            pass

        return {"received": True}

    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
