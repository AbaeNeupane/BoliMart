import { BrowserRouter, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"

import ProtectedRoute from "./components/auth/ProtectedRoute"
import RoleGuard from "./components/auth/RoleGuard"
import { ROLES } from "./utils/constants"

import Home from "./pages/Home"
import ListingDetail from "./pages/ListingDetail"
import Login from "./pages/Login"
import Register from "./pages/Register"
import NotFound from "./pages/NotFound"

import SellerDashboard from "./pages/seller/SellerDashboard"
import CreateListing from "./pages/seller/CreateListing"
import EditListing from "./pages/seller/EditListing"
import ListingAnalytics from "./pages/seller/ListingAnalytics"

import BuyerDashboard from "./pages/buyer/BuyerDashboard"
import Checkout from "./pages/buyer/Checkout"

import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminUsers from "./pages/admin/AdminUsers"
import AdminListings from "./pages/admin/AdminListings"
import AdminTransactions from "./pages/admin/AdminTransactions"
import AdminSettings from "./pages/admin/AdminSettings"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Seller */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleGuard roles={[ROLES.SELLER, ROLES.ADMIN]} />}>
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/seller/listings/create" element={<CreateListing />} />
              <Route path="/seller/listings/:id/edit" element={<EditListing />} />
              <Route path="/seller/listings/:id/analytics" element={<ListingAnalytics />} />
            </Route>
          </Route>

          {/* Buyer */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleGuard roles={[ROLES.BUYER, ROLES.ADMIN]} />}>
              <Route path="/buyer" element={<BuyerDashboard />} />
              <Route path="/buyer/checkout/:listingId" element={<Checkout />} />
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
      </BrowserRouter>
    </QueryClientProvider>
  )
}

