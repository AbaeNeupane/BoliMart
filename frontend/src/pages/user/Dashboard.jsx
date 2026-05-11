import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import client from "../../api/client"
import Navbar from "../../components/layout/Navbar"
import Button from "../../components/ui/Button"
import { formatCurrency } from "../../utils/formatters"

export default function Dashboard() {
  const { data: myListings } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => client.get("/listings?my=true"),
  })

  const { data: myBids } = useQuery({
    queryKey: ["my-bids"],
    queryFn: () => client.get("/bids/my"),
  })

  const { data: stripeData } = useQuery({
    queryKey: ["stripe-status"],
    queryFn: () => client.get("/payments/connect/status"),
  })

  const listings = myListings?.data || []
  const bids = myBids?.data || []
  const stripeConnected = stripeData?.data?.connected

  const activeListings = listings.filter((l) => l.status === "active").length
  const activeBids = bids.filter((b) => b.status === "active").length
  const wonAuctions = bids.filter((b) => b.status === "won").length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Stripe banner */}
        {!stripeConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-800">Connect your bank account to sell items</p>
              <p className="text-sm text-amber-600">You need to complete Stripe onboarding before listing products for sale</p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                client
                  .post("/payments/connect/onboard")
                  .then((r) => (window.location.href = r.data.url))
              }
            >
              Connect bank
            </Button>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-400 uppercase tracking-wide">Active listings</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{activeListings}</p>
            <Link to="/my-listings" className="text-sm text-primary-500 hover:underline mt-2 inline-block">
              View all
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-400 uppercase tracking-wide">Active bids</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{activeBids}</p>
            <Link to="/my-bids" className="text-sm text-primary-500 hover:underline mt-2 inline-block">
              View all
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-400 uppercase tracking-wide">Won auctions</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{wonAuctions}</p>
            {wonAuctions > 0 && (
              <Link to="/my-bids" className="text-sm text-primary-500 hover:underline mt-2 inline-block">
                Complete checkout
              </Link>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => (window.location.href = "/listings/create")}>
              + Create listing
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/my-listings")}>
              View my listings
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/my-bids")}>
              View my bids
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
