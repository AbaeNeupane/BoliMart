import { useEffect } from "react"
import { useSocketStore } from "../store/socketStore"
import { WS_URL } from "../utils/constants"

export const useAuctionSocket = (listingId, onBidReceived) => {
  useEffect(() => {
    const socket = new WebSocket(`${WS_URL}/ws/listing/${listingId}`)

    socket.onopen = () => {
      useSocketStore.getState().setConnected(true)
    }

    socket.onmessage = (event) => {
      const bidData = JSON.parse(event.data)
      onBidReceived?.(bidData)
    }

    socket.onclose = () => {
      useSocketStore.getState().setConnected(false)
    }

    useSocketStore.getState().setSocket(socket)

    return () => socket.close()
  }, [listingId, onBidReceived])
}
