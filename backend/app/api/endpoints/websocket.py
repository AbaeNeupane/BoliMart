from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json

router = APIRouter()

# In-memory store for WebSocket connections per auction
# In production, use Redis pub/sub
active_connections: dict = {}

@router.websocket("/auction/{listing_id}")
async def auction_ws(websocket: WebSocket, listing_id: str):
    """WebSocket endpoint for real-time auction updates."""
    await websocket.accept()
    
    # Add connection to tracking
    if listing_id not in active_connections:
        active_connections[listing_id] = []
    active_connections[listing_id].append(websocket)
    
    try:
        while True:
            # Keep connection open and ready to receive messages
            data = await websocket.receive_text()
            
            # Broadcast message to all connected clients for this auction
            message = {
                "type": "auction_update",
                "data": json.loads(data) if data else {},
            }
            
            for connection in active_connections.get(listing_id, []):
                try:
                    await connection.send_json(message)
                except Exception:
                    pass
                    
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        # Remove connection
        if listing_id in active_connections:
            active_connections[listing_id] = [
                conn for conn in active_connections[listing_id]
                if conn != websocket
            ]
            if not active_connections[listing_id]:
                del active_connections[listing_id]
        
        try:
            await websocket.close()
        except Exception:
            pass
