import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      login: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),

      logout: () => set({ accessToken: null, refreshToken: null, user: null }),

      isAuthenticated: () => !!useAuthStore.getState().accessToken,
    }),
    {
      name: "auth-storage",
      // Only persist the tokens — NOT the user object.
      // On restart, the app will always re-fetch /users/me to get fresh user
      // data. This prevents the ghost login state where a stale user object
      // exists in localStorage but the token is expired or the backend is down.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        // user is intentionally excluded — always fetched fresh on startup
      }),
    }
  )
)