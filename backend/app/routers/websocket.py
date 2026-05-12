from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_websocket_status():
    return {"message": "WebSocket endpoint - to be implemented"}
