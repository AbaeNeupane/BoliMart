import { Link } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { ROLES } from "../../utils/constants"

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuthStore()

  const menuItems = user ? [
    { label: "Home", href: "/" },
    { label: "My Dashboard", href: user.role === ROLES.SELLER ? "/seller" : user.role === ROLES.BUYER ? "/buyer" : "/admin" },
    ...(user.role === ROLES.SELLER ? [
      { label: "Create Listing", href: "/seller/listings/create" },
      { label: "My Listings", href: "/seller" },
    ] : []),
    ...(user.role === ROLES.BUYER ? [
      { label: "My Bids", href: "/buyer" },
    ] : []),
    ...(user.role === ROLES.ADMIN ? [
      { label: "Users", href: "/admin/users" },
      { label: "Listings", href: "/admin/listings" },
      { label: "Transactions", href: "/admin/transactions" },
    ] : []),
  ] : [
    { label: "Home", href: "/" },
    { label: "Sign In", href: "/login" },
    { label: "Sign Up", href: "/register" },
  ]

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white border-r border-gray-200 transform transition-transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 z-40`}>
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClose}
            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
