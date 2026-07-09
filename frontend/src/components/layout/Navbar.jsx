import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"
import { useState, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCategories } from "../../api/listings"
import NotificationBell from "../notifications/NotificationBell"
import Profile from "../../pages/user/Profile"
import logo from "../../assets/logo1.png"

export default function Navbar() {
  const { user, toggleSidebar } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const activeCategory = params.get("category")
  const [guestOpen, setGuestOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false)
  const categoryRef = useRef(null)
  const mobileSearchRef = useRef(null)

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    staleTime: Infinity,
  })
  const categories = categoriesData?.data || []

  const isHome = location.pathname === "/"

  const prevPathRef = useRef(location.pathname + location.search)
  if (prevPathRef.current !== location.pathname + location.search) {
    prevPathRef.current = location.pathname + location.search
    if (guestOpen) setGuestOpen(false)
    if (mobileSearchOpen) setMobileSearchOpen(false)
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
    setGuestOpen(false)
    setCategoryOpen(false)
    setMobileCategoryOpen(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const nextParams = new URLSearchParams(location.search)
      nextParams.set("q", searchQuery.trim())
      nextParams.delete("page")
      navigate(`/?${nextParams.toString()}`)
      setSearchQuery("")
      setGuestOpen(false)
      setMobileSearchOpen(false)
    }
  }

  return (
    <>
      {/* ── Guest sidebar — logged out mobile only ── */}
      {!user && (
        <>
          {guestOpen && (
            <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setGuestOpen(false)} />
          )}
          <aside
            className={`fixed left-0 z-40 w-72 bg-gray-900 text-white
              transform transition-transform duration-300 ease-in-out overflow-y-auto scrollbar-hide
              ${guestOpen ? "translate-x-0" : "-translate-x-full"}`}
            style={{ top: "56px", height: "calc(100vh - 56px)" }}
          >
            {/* Header */}
            <div className="px-4 py-4 bg-gray-800 border-b border-gray-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12a3 3 0 100-6 3 3 0 000 6zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z" />
                </svg>
              </div>
              <span className="font-semibold text-white">Hello, Guest</span>
            </div>

            {/* Auth links */}
            <div className="px-4 py-4 border-b border-gray-700">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Account</p>
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setGuestOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold border border-gray-500 hover:border-gray-300 text-gray-200 hover:text-white rounded transition-colors">
                  Sign in
                </Link>
                <Link to="/register" onClick={() => setGuestOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors">
                  Sign up
                </Link>
                
              </div>
            </div>

            {/* Add new section on sidebar on logged out state */}
          </aside>
        </>
      )}

      <header className="sticky top-0 z-50 bg-gray-900 w-full">

        {/* ── Top bar ── */}
        <div className="w-full px-3 sm:px-4">
          <div className="h-14 flex items-center gap-2 sm:gap-3">

            {/* Logo */}
            <a href="/" className="inline-block flex-shrink-0 border-2 border-transparent hover:border-gray-500 rounded px-1 py-0.5 transition-colors">
              <img src={logo} alt="Boli" className="h-9 w-auto brightness-100" />
            </a>

            {/* Search bar — desktop with category dropdown */}
            <div className="hidden sm:flex flex-1 max-w-100">
              <div className="relative" ref={categoryRef}>
                <button
                  onClick={() => setCategoryOpen((o) => !o)}
                  className="px-3 h-10 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-l-md transition-colors"
                >
                  {activeCategory || "All"}
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {categoryOpen && (
                  <>
                    <div className="fixed inset-0 z-[59]" onClick={() => setCategoryOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60] max-h-80 overflow-y-auto">
                      <button onClick={() => { handleCategory("All"); setCategoryOpen(false) }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${!activeCategory ? "bg-primary-50 text-primary-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                        All categories
                      </button>
                      {categories.map((cat) => (
                        <button key={cat.id} onClick={() => { handleCategory(cat.name); setCategoryOpen(false) }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${activeCategory === cat.name ? "bg-primary-50 text-primary-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <form onSubmit={handleSearch} className="flex flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search auctions..."
                  className="flex-1 h-10 px-3 text-sm text-gray-900 bg-white border-0 outline-none placeholder-gray-400 min-w-0"
                />
                <button type="submit" className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-r-md transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* ── Right side ── */}
            <div className="flex-shrink-0 flex items-center gap-1 ml-auto">

              {/* Mobile search icon — homepage only */}
              {isHome && <button
                onClick={() => setMobileSearchOpen((o) => !o)}
                className="sm:hidden flex items-center justify-center w-9 h-9 rounded border-2 border-transparent hover:border-gray-500 text-primary-500 transition-colors"
                aria-label="Search"
              >
                {mobileSearchOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                )}
              </button>}

              {/* Logged out — desktop */}
              {!user && (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login"
                    className="px-4 py-1.5 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors">
                    Sign in
                  </Link>
                  <Link to="/register"
                    className="px-4 py-1.5 text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors">
                    Get started
                  </Link>
                </div>
              )}


              {/* Notification bell — logged in only */}
              {user && <NotificationBell />}
              

              {/* Sidebar toggle — logged in all sizes */}
              {user && (
                <button
                  onClick={toggleSidebar}
                  className="flex flex-col items-start px-2 py-1 rounded border-2 border-transparent hover:border-gray-500 transition-colors text-primary-500"
                  aria-label="Toggle sidebar"
                >
                  <span className="text-sm font-bold leading-tight flex items-center gap-1">
                    Menu
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </span>
                </button>
              )}

              {/* Guest sidebar toggle — logged out mobile */}
              {!user && (
                <button
                  onClick={() => setGuestOpen((o) => !o)}
                  className="sm:hidden flex flex-col items-center px-2 py-1 rounded border-2 border-transparent hover:border-gray-500 transition-colors text-primary-500"
                  aria-label="Toggle menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}

            </div>
          </div>
        </div>

        {/* ── Mobile search icon — slides down when open ── */}
        <div
          className={`sm:hidden transition-all duration-300 ease-in-out bg-gray-800 border-t border-gray-700
            ${mobileSearchOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none max-h-0 overflow-hidden"}`}
        >
          <div className="px-3 py-3 space-y-2">
            {/* Search input */}
             {/* Search */}
            <div className="px-4 py-4 border-b border-gray-700">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search auctions..."
                  className="flex-1 h-9 px-3 text-sm text-gray-900 bg-white rounded-l-md border-0 outline-none min-w-0"
                />
                <button type="submit" className="h-9 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded-r-md transition-colors flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </button>
              </form>
            </div>
            

            {/* Category dropdown */}
            <div className="relative">
              <button
                onClick={() => setMobileCategoryOpen((o) => !o)}
                className="w-full h-9 px-3 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-md flex items-center justify-between transition-colors"
              >
                <span>{activeCategory || "All categories"}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${mobileCategoryOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {mobileCategoryOpen && (
                <>
                  <div className="fixed inset-0 z-[59]" onClick={() => setMobileCategoryOpen(false)} />
                  <div className="fixed left-0 right-0 mx-3 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[60] max-h-56 overflow-y-auto scrollbar-hide" style={{top: "auto"}}>
                    <button onClick={() => { handleCategory("All"); setMobileCategoryOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!activeCategory ? "bg-primary-50 text-primary-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                      All categories
                    </button>
                    {categories.map((cat) => (
                      <button key={cat.id} onClick={() => { handleCategory(cat.name); setMobileCategoryOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${activeCategory === cat.name ? "bg-primary-50 text-primary-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </header>
    </>
  )
}