import axios from "axios"
import { API_URL } from "../utils/constants"
import { useAuthStore } from "../store/authStore"

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

// Attach JWT to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 with refresh attempt, then enhanced error handling
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config

    // Attempt refresh on 401
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" } }
          )

          const { access_token, refresh_token } = response.data
          useAuthStore.getState().setTokens(access_token, refresh_token)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return client(originalRequest)
        } catch (_err) {
          // Failed refresh; fall through to logout below
        }
      }

      // Logout and redirect to login on failed refresh
      useAuthStore.getState().logout()
      window.location.href = "/login"
      return Promise.reject(error)
    }

    // Add retryable flag for 429 (rate limit) and 5xx errors
    if (status === 429 || (status >= 500 && status < 600)) {
      error.retryable = true
    }

    // Attach structured error info
    error.userMessage = error.response?.data?.detail || error.message || "Unknown error"
    error.statusCode = status

    return Promise.reject(error)
  }
)

export default client