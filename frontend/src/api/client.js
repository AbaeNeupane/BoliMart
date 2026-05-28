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

// Only logout on 401 for actual auth failures
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url = error.config?.url || ""
    const status = error.response?.status

    // These endpoints are stubs or not yet implemented — don't logout
    const isStubEndpoint =
      url.includes("/bids/my") ||
      url.includes("/payments/connect") ||
      url.includes("/listings/my")

    if (status === 401 && !isStubEndpoint) {
      useAuthStore.getState().logout()
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default client