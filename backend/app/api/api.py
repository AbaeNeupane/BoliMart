from fastapi import APIRouter

from app.api.endpoints import auth, users, listings, bids, payments, uploads, webhooks, admin, categories
from app.api.endpoints import websocket
from app.api.endpoints import notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(bids.router, prefix="/bids", tags=["bids"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(uploads.router, prefix="/upload", tags=["uploads"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
api_router.include_router(notifications.router, tags=["notifications"])