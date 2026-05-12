from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class PaymentCreate(BaseModel):
    listing_id: str
    amount: float

class PaymentResponse(BaseModel):
    id: str
    status: str
    amount: float

    class Config:
        from_attributes = True

@router.post("/create-payment-intent")
async def create_payment_intent(payment: PaymentCreate):
    return {"message": "Create payment intent - to be implemented"}

@router.post("/confirm-payment")
async def confirm_payment(payment_id: str):
    return {"message": f"Confirm payment {payment_id} - to be implemented"}
