from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter()

# In-memory store: { listing_id: [WebSocket, ...] }
# In production, replace with Redis pub/sub
active_connections: dict[str, list[WebSocket]] = {}


def get_connection_count(listing_id: str) -> int:
    return len(active_connections.get(listing_id, []))


async def broadcast_bid(listing_id: str, payload: dict):
    """
    Broadcast a new bid event to all clients watching this listing.
    Called directly from place_bid_logic after a successful commit.
    """
    connections = active_connections.get(str(listing_id), [])
    if not connections:
        return

    message = {
        "type": "new_bid",
        "data": payload,
    }

    dead = []
    for ws in connections:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)

    # Clean up dead connections
    if dead:
        active_connections[str(listing_id)] = [
            c for c in connections if c not in dead
        ]
        if not active_connections[str(listing_id)]:
            del active_connections[str(listing_id)]


@router.websocket("/auction/{listing_id}")
async def auction_ws(websocket: WebSocket, listing_id: str):
    """WebSocket endpoint for real-time auction updates."""
    await websocket.accept()

    lid = str(listing_id)
    if lid not in active_connections:
        active_connections[lid] = []
    active_connections[lid].append(websocket)

    try:
        # Send current viewer count on connect
        await websocket.send_json({
            "type": "connected",
            "data": {"viewers": get_connection_count(lid)},
        })

        while True:
            # Keep connection alive — we don't expect messages from client
            # but receive_text() lets us detect disconnects cleanly
            await websocket.receive_text()

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if lid in active_connections:
            active_connections[lid] = [
                c for c in active_connections[lid] if c != websocket
            ]
            if not active_connections[lid]:
                del active_connections[lid]
        try:
            await websocket.close()
        except Exception:
            pass