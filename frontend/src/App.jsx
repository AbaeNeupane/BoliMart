import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import { useEffect, useState, useCallback } from "react"

import { ErrorBoundary } from "./components/ErrorBoundary"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import RoleGuard from "./components/auth/RoleGuard"
import Navbar from "./components/layout/Navbar"
import { ROLES } from "./utils/constants"
import { useAuthStore } from "./store/authStore"
import { getMe, refreshToken } from "./api/auth"

import Home from "./pages/Home"
import ListingDetail from "./pages/ListingDetail"
import Login from "./pages/Login"
import Register from "./pages/Register"
import VerifyEmail from "./pages/VerifyEmail"
import NotFound from "./pages/NotFound"

import Dashboard from "./pages/user/Dashboard"
import MyListings from "./pages/user/MyListings"
import CreateListing from "./pages/user/CreateListing"
import EditListing from "./pages/user/EditListing"
import ListingAnalytics from "./pages/user/ListingAnalytics"
import MyBids from "./pages/user/MyBids"
import Checkout from "./pages/user/Checkout"

import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminListings from "./pages/admin/AdminListings"
import AdminTransactions from "./pages/admin/AdminTransactions"
import AdminSettings from "./pages/admin/AdminSettings"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthInitializer({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  // Initialize checking to true only if there's a token to validate.
  // Using a ref to track the initial value so the effect doesn't re-run
  // when accessToken changes mid-session (e.g. after token refresh).
  const [checking, setChecking] = useState(!!accessToken)

  const validate = useCallback(async () => {
    if (!accessToken) return

    try {
      const res = await getMe()
      setUser(res.data)
    } catch {
      const storedRefresh = useAuthStore.getState().refreshToken
      if (!storedRefresh) {
        logout()
        return
      }
      try {
        const refreshResponse = await refreshToken(storedRefresh)
        const { access_token, refresh_token } = refreshResponse.data
        useAuthStore.getState().setTokens(access_token, refresh_token)
        const meResponse = await getMe()
        setUser(meResponse.data)
      } catch {
        logout()
      }
    } finally {
      setChecking(false)
    }
  }, [accessToken, setUser, logout])

  useEffect(() => {
    validate()
  }, [validate])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthInitializer>
            <Toaster position="top-right" />
            <Navbar />
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              {/* User (Buyer + Seller) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleGuard roles={[ROLES.USER, ROLES.ADMIN]} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/my-listings" element={<MyListings />} />
                  <Route path="/listings/create" element={<CreateListing />} />
                  <Route path="/listings/:id/edit" element={<EditListing />} />
                  <Route path="/listings/:id/analytics" element={<ListingAnalytics />} />
                  <Route path="/my-bids" element={<MyBids />} />
                  <Route path="/checkout/:listingId" element={<Checkout />} />
                </Route>
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute />}>
                <Route element={<RoleGuard roles={[ROLES.ADMIN]} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/listings" element={<AdminListings />} />
                  <Route path="/admin/transactions" element={<AdminTransactions />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}