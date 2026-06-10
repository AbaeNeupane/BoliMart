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

// Log out and redirect on any 401.
// The isStubEndpoint exception has been removed — all endpoints are real
// now. The ghost login bug was caused by swallowing 401s on dashboard
// endpoints, which let expired tokens persist indefinitely.
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config

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
          // Failed refresh; fall through to logout below.
        }
      }

      useAuthStore.getState().logout()
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default client