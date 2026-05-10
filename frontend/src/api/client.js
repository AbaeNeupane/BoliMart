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

// Auto-refresh on 401
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return client(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default client
