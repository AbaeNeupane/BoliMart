import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { ROLES } from "../../utils/constants"
import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCategories } from "../../api/listings"
import logo from "../../assets/logo1.png"

export default function Navbar() {
  const { user, logout, toggleSidebar } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const activeCategory = params.get("category")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const dashboardPath = {
    [ROLES.ADMIN]: "/admin",
    [ROLES.USER]: "/dashboard",
  }[user?.role] || "/"

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    staleTime: Infinity,
  })
  const categories = categoriesData?.data || []

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/login")
    setMobileOpen(false)
  }

  const handleCategory = (cat) => {
    const nextParams = new URLSearchParams(location.search)
    if (cat === "All") {
      nextParams.delete("category")
    } else {
      nextParams.set("category", cat)
    }
    nextParams.delete("page")
    navigate(`/?${nextParams.toString()}`)
    setMobileOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const nextParams = new URLSearchParams(location.search)
      nextParams.set("q", searchQuery.trim())
      nextParams.delete("page")
      navigate(`/?${nextParams.toString()}`)
      setSearchQuery("")
      setMobileOpen(false)
    }
  }

  // Determine if we're on a dashboard/admin page where the sidebar is shown
  const isDashboardPage =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/my-") ||
    location.pathname.startsWith("/listings/create") ||
    location.pathname.startsWith("/checkout")

  return (
    <header className="sticky top-0 z-50 bg-gray-900 w-full">
      {/* Top bar */}
      <div className="w-full px-3 sm:px-6">
        <div className="h-14 flex items-center gap-3">

          {/* Logo */}
          <a href="/" className="inline-block flex-shrink-0">
            <img src={logo} alt="Boli" className="h-9 w-auto brightness-100" />
          </a>

          {/* Search bar — hidden below sm */}
          <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-100">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search auctions..."
              className="flex-1 h-10 px-3 text-sm text-gray-900 bg-white rounded-l-md border-0 outline-none placeholder-gray-400 min-w-0"
            />
            <button
              type="submit"
              className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-r-md transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </form>

          {/* Right side */}
          <div className="flex-shrink-0 flex items-center gap-1 ml-auto">

            {/* Desktop auth buttons — hidden below sm */}
            {!user && (
              <>
                <Link to="/login" className="hidden sm:flex items-center px-3 py-1.5 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors">
                  Sign in
                </Link>
                <Link to="/register" className="hidden sm:flex items-center px-3 py-1.5 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors">
                  Get started
                </Link>
              </>
            )}

            {/* Profile icon — always visible, shows dropdown */}
            <div className={`relative ${!user ? "sm:hidden" : ""}`} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white hover:bg-gray-700 transition-colors text-white"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12a3 3 0 100-6 3 3 0 000 6zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
                </svg>
              </button>

              {dropdownOpen && (
                !user ? (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <Link to="/login" onClick={() => setDropdownOpen(false)} className="flex px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Sign in
                    </Link>
                    <Link to="/register" onClick={() => setDropdownOpen(false)} className="flex px-4 py-2.5 text-sm font-semibold text-primary-600 hover:bg-gray-50 transition-colors">
                      Get started
                    </Link>
                  </div>
                ) : (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || user.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link to={dashboardPath} onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      Dashboard
                    </Link>
                    <Link to="/my-bids" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      My bids
                    </Link>
                    <Link to="/my-listings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      My listings
                    </Link>
                    {user.role === ROLES.USER && (
                      <Link to="/listings/create" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Sell an item
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Hamburger — visible below sm only (public pages) */}
            <button
              onClick={() => user ? toggleSidebar() : setMobileOpen((o) => !o)}
              className="sm:hidden flex p-2 text-white hover:bg-gray-700 rounded transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Category bar — desktop only */}
      <div className="bg-gray-700 hidden sm:block w-full">
        <div className="w-full px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <Link
              to="/"
              className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                location.pathname === "/" && !activeCategory
                  ? "text-white bg-gray-600"
                  : "text-gray-200 hover:text-white hover:bg-gray-600"
              }`}
            >
              All auctions
            </Link>
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                to={`/?category=${encodeURIComponent(cat.name)}`}
                className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                  activeCategory === cat.name
                    ? "text-white bg-gray-600"
                    : "text-gray-200 hover:text-white hover:bg-gray-600"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu — visible below sm only */}
      {mobileOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200 shadow-lg">

          {/* Search */}
          <form onSubmit={handleSearch} className="flex p-3 border-b border-gray-100">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search auctions..."
              className="flex-1 h-9 px-3 text-sm border border-gray-200 rounded-l-md outline-none focus:border-primary-500"
            />
            <button type="submit" className="h-9 px-3 bg-primary-500 text-white rounded-r-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </form>

          {/* Category selector */}
          <div className="px-3 py-3 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={activeCategory || "All"}
              onChange={(e) => handleCategory(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white text-sm text-gray-700 px-3 py-2 outline-none focus:border-primary-500"
            >
              <option value="All">All auctions</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Sidebar nav links — only on dashboard pages when logged in */}
          {user && isDashboardPage && (
            <div className="px-3 py-3 border-t border-gray-100 space-y-4">
              <div>
                <p className="px-3 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Main</p>
                <ul className="space-y-0.5">
                  {[
                    { label: "Home", href: "/" },
                    { label: "Dashboard", href: user?.role === ROLES.ADMIN ? "/admin" : "/dashboard" },
                  ].map(({ label, href }) => (
                    <li key={href}>
                      <Link to={href} onClick={() => setMobileOpen(false)}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === href ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-100"}`}>
                        {location.pathname === href && <span className="w-1 h-4 bg-primary-500 rounded-full mr-2.5 flex-shrink-0" />}
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="px-3 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {user?.role === ROLES.ADMIN ? "Manage" : "Listings"}
                </p>
                <ul className="space-y-0.5">
                  {(user?.role === ROLES.ADMIN ? [
                    { label: "Users", href: "/admin/users" },
                    { label: "Listings", href: "/admin/listings" },
                    { label: "Transactions", href: "/admin/transactions" },
                    { label: "Settings", href: "/admin/settings" },
                  ] : [
                    { label: "My Listings", href: "/my-listings" },
                    { label: "Create Listing", href: "/listings/create" },
                    { label: "My Bids", href: "/my-bids" },
                  ]).map(({ label, href }) => (
                    <li key={href}>
                      <Link to={href} onClick={() => setMobileOpen(false)}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === href ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-100"}`}>
                        {location.pathname === href && <span className="w-1 h-4 bg-primary-500 rounded-full mr-2.5 flex-shrink-0" />}
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}