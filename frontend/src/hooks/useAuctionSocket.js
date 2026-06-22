import { useEffect, useRef, useState } from "react"
import { WS_URL } from "../utils/constants"

const RECONNECT_DELAY = 3000  // ms before attempting reconnect
const MAX_RECONNECTS = 5

export const useAuctionSocket = (listingId, onBidReceived) => {
  const onBidRef = useRef(onBidReceived)
  const reconnectCount = useRef(0)
  const reconnectTimer = useRef(null)
  const socketRef = useRef(null)
  const unmounted = useRef(false)
  const [isConnected, setIsConnected] = useState(false)
  const [viewers, setViewers] = useState(null)

  useEffect(() => {
    onBidRef.current = onBidReceived
  })

  useEffect(() => {
    if (!listingId) return
    unmounted.current = false

    function connect() {
      if (unmounted.current) return

      const ws = new WebSocket(`${WS_URL}/ws/auction/${listingId}`)
      socketRef.current = ws

      ws.onopen = () => {
        if (unmounted.current) { ws.close(); return }
        setIsConnected(true)
        reconnectCount.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === "connected") {
            setViewers(msg.data?.viewers ?? null)
            return
          }

          if (msg.type === "new_bid" && msg.data) {
            onBidRef.current?.(msg.data)
            return
          }

          // Legacy format — plain bid object without type wrapper
          if (msg.bid_amount !== undefined) {
            onBidRef.current?.(msg)
          }
        } catch (err) {
          console.error("[WS] Failed to parse message:", err)
        }
      }

      ws.onerror = () => {
        // onclose will fire after onerror, handle reconnect there
      }

      ws.onclose = () => {
        if (unmounted.current) return
        setIsConnected(false)

        if (reconnectCount.current < MAX_RECONNECTS) {
          reconnectCount.current += 1
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY)
        }
      }
    }

    connect()

    return () => {
      unmounted.current = true
      clearTimeout(reconnectTimer.current)
      const ws = socketRef.current
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close()
      }
    }
  }, [listingId])

  return { isConnected, viewers }
}