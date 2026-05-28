import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"

export default function RoleGuard({ roles }) {
  const { user, accessToken } = useAuthStore()

  // Still have a token but user hasn't loaded yet — wait
  if (accessToken && !user) return null

  return roles.includes(user?.role) ? <Outlet /> : <Navigate to="/" replace />
}