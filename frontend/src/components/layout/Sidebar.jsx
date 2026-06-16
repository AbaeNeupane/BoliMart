import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { ROLES } from "../../utils/constants"

const USER_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { label: "Home", href: "/" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    label: "LISTINGS",
    items: [
      { label: "My Listings", href: "/my-listings" },
      { label: "Create Listing", href: "/listings/create" },
      { label: "My Bids", href: "/my-bids" },
    ],
  },
]

const ADMIN_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { label: "Home", href: "/" },
      { label: "Dashboard", href: "/admin" },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { label: "Users", href: "/admin/users" },
      { label: "Listings", href: "/admin/listings" },
      { label: "Transactions", href: "/admin/transactions" },
      { label: "Settings", href: "/admin/settings" },
    ],
  },
]

export default function Sidebar() {
  const { user, sidebarOpen, setSidebar } = useAuthStore()
  const location = useLocation()
  const sections = user?.role === ROLES.ADMIN ? ADMIN_SECTIONS : USER_SECTIONS
  const onClose = () => setSidebar(false)

  return (
    <>
      {/* Overlay — mobile only, when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile sidebar — slide in/out below md (768px) */}
      <aside
        className={`
          fixed left-0 z-40 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          overflow-y-auto md:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ top: "56px", height: "calc(100vh - 56px)" }}
      >
        <SidebarContent user={user} sections={sections} location={location} onClose={onClose} />
      </aside>

      {/* Desktop sidebar — always visible from md (768px) */}
      <aside
        className="hidden md:block fixed left-0 z-40 w-64 bg-white border-r border-gray-200 overflow-y-auto"
        style={{ top: "103px", height: "calc(100vh - 103px)" }}
      >
        <SidebarContent user={user} sections={sections} location={location} onClose={() => {}} />
      </aside>
    </>
  )
}

function SidebarContent({ user, sections, location, onClose }) {
  return (
    <>
      {user && (
        <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.full_name || user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive
                          ? "bg-primary-50 text-primary-600"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                      {isActive && (
                        <span className="w-1 h-4 bg-primary-500 rounded-full mr-2.5 flex-shrink-0" />
                      )}
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  )
}