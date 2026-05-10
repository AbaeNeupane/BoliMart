import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { ROLES } from "../../utils/constants"
import Button from "../ui/Button"

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const dashboardPath = {
    [ROLES.ADMIN]: "/admin",
    [ROLES.SELLER]: "/seller",
    [ROLES.BUYER]: "/buyer",
  }[user?.role] || "/"

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
          <span className="text-primary-500">⚡</span> AuctionHub
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to={dashboardPath} className="text-sm text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                {user.role}
              </span>
              <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/login") }}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
              <Button size="sm" onClick={() => navigate("/register")}>Get started</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
