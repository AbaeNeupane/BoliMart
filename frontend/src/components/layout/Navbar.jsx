import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCategories } from "../../api/listings"
import logo from "../../assets/logo1.png"

export default function Navbar() {
  const { user, toggleSidebar } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const activeCategory = params.get("category")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")


  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    staleTime: Infinity,
  })
  const categories = categoriesData?.data || []

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

            {/* Logged in — sidebar toggle below sm */}
            {user && (
              <button
                onClick={toggleSidebar}
                className="sm:hidden flex p-2 text-white hover:bg-gray-700 rounded transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {/* Logged out — hamburger menu below sm */}
            {!user && (
              <button
                onClick={() => setMobileOpen((o) => !o)}
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
            )}

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

      {/* Mobile menu — logged out only, below sm */}
      {!user && mobileOpen && (
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

          {/* Auth links */}
          <div className="p-3 space-y-2">
            <Link to="/login" onClick={() => setMobileOpen(false)} className="flex px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
              Sign in
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)} className="flex px-3 py-2.5 text-sm font-semibold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      )}

    </header>
  )
}