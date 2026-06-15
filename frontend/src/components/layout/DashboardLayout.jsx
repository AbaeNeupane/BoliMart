import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen((o) => !o)}
        className="md:hidden fixed bottom-4 right-4 z-50 w-11 h-11 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 md:ml-64 bg-gray-50 min-w-0">
        <Outlet />
      </main>

    </div>
  )
}