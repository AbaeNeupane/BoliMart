import { create } from "zustand"

export const useSocketStore = create((set) => ({
  socket: null,
  isConnected: false,

  setSocket: (socket) => set({ socket, isConnected: socket?.connected || false }),

  setConnected: (isConnected) => set({ isConnected }),

  disconnect: () => set({ socket: null, isConnected: false }),
}))
