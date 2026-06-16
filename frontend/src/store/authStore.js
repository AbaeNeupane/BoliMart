import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      // Sidebar state
      sidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (val) => set({ sidebarOpen: val }),

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      login: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      isAuthenticated: () => !!useAuthStore.getState().accessToken,
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        // user and sidebarOpen intentionally excluded
      }),
    }
  )
)