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

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default client