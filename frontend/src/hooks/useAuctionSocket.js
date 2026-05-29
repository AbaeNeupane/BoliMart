import { useEffect, useRef } from "react"
import { useSocketStore } from "../store/socketStore"
import { WS_URL } from "../utils/constants"

export const useAuctionSocket = (listingId, onBidReceived) => {
  const onBidReceivedRef = useRef(onBidReceived)

  // Keep callback ref current without re-triggering the effect
  useEffect(() => {
    onBidReceivedRef.current = onBidReceived
  }, [onBidReceived])

  useEffect(() => {
    if (!listingId) return

    const socket = new WebSocket(`${WS_URL}/ws/auction/${listingId}`)

    socket.onopen = () => {
      useSocketStore.getState().setConnected(true)
    }

    socket.onmessage = (event) => {
      try {
        const bidData = JSON.parse(event.data)
        onBidReceivedRef.current?.(bidData)
      } catch (err) {
        console.error("[WS] Failed to parse message:", err)
      }
    }

    socket.onclose = () => {
      useSocketStore.getState().setConnected(false)
    }

    useSocketStore.getState().setSocket(socket)

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close()
      }
    }
  }, [listingId])
}