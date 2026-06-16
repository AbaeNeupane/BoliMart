import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

// Sidebar now manages its own open/close state via authStore
// No need for local state here anymore
export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 md:ml-64 bg-gray-50 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}