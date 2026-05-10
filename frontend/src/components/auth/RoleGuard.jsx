import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"

export default function RoleGuard({ roles }) {
  const { user } = useAuthStore()
  return roles.includes(user?.role) ? <Outlet /> : <Navigate to="/" replace />
}
