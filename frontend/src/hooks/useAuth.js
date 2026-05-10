import { useAuthStore } from "../store/authStore"

export const useAuth = () => {
  const { accessToken, user, login, logout, isAuthenticated } = useAuthStore()
  return { accessToken, user, login, logout, isAuthenticated: isAuthenticated() }
}
