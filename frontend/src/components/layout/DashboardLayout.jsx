import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import { useAuthStore } from "../../store/authStore"

export default function DashboardLayout() {
  const { sidebarOpen } = useAuthStore()

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main
        className={`
          flex-1 bg-gray-50 min-w-0
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "md:mr-64" : "md:mr-0"}
        `}
      >
        <Outlet />
      </main>
    </div>
  )
}