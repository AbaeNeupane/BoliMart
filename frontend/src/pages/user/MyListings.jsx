import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import client from "../../api/client"
import { cancelListing } from "../../api/listings"
import Badge from "../../components/ui/Badge"
import Button from "../../components/ui/Button"
import { CompactCountdown } from "../../components/listings/CountdownTimer"
import Skeleton from "../../components/ui/Skeleton"
import { formatCurrency } from "../../utils/formatters"
import toast from "react-hot-toast"

export default function MyListings() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => client.get("/listings/my/listings"),
  })

  const { data: stripeData } = useQuery({
    queryKey: ["stripe-status"],
    queryFn: () => client.get("/payments/connect/status"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => cancelListing(id),
    onSuccess: () => {
      toast.success("Listing cancelled")
      queryClient.invalidateQueries(["my-listings"])
    },
    onError: (err) => {
      const detail = err.response?.data?.detail
      toast.error(detail || "Failed to cancel listing")
    },
  })

  const handleDelete = (listing) => {
    if (listing.bid_count > 0) {
      toast.error("Cannot cancel a listing that already has bids")
      return
    }
    if (!window.confirm(`Cancel "${listing.title}"? This cannot be undone.`)) return
    deleteMutation.mutate(listing.id)
  }

  const listings = data?.data?.items || []
  const stripeConnected = stripeData?.data?.connected

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <Link to="/listings/create">
            <Button>+ New listing</Button>
          </Link>
        </div>

        {/* Stripe connect banner */}
        {!stripeConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-800">Connect your bank account to receive payouts</p>
              <p className="text-sm text-amber-600">You need to complete Stripe onboarding to sell items</p>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Active listings",
              value: listings.filter((l) => l.status === "active").length,
            },
            {
              label: "Items sold",
              value: listings.filter((l) => l.status === "sold").length,
            },
            {
              label: "Total earned",
              value: formatCurrency(
                listings
                  .filter((l) => l.status === "sold")
                  .reduce((a, l) => a + parseFloat(l.current_price || 0), 0)
              ),
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Listings table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Your listings</h2>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              No listings yet.{" "}
              <Link to="/listings/create" className="text-primary-500">
                Create one
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Item</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Current bid</th>
                  <th className="text-left px-5 py-3">Time left</th>
                  <th className="text-left px-5 py-3">Bids</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{listing.title}</td>
                    <td className="px-5 py-4">
                      <Badge status={listing.status} />
                    </td>
                    <td className="px-5 py-4 text-gray-900 font-semibold">
                      {formatCurrency(listing.current_price || listing.starting_price)}
                    </td>
                    <td className="px-5 py-4">
                      <CompactCountdown endsAt={listing.auction_end_time} />
                    </td>
                    <td className="px-5 py-4 text-gray-600">{listing.bid_count || 0}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {listing.status === "active" && listing.bid_count === 0 && (
                          <Link
                            to={`/listings/${listing.id}/edit`}
                            className="text-primary-500 text-sm hover:underline"
                          >
                            Edit
                          </Link>
                        )}
                        {["active", "draft"].includes(listing.status) && (
                          <button
                            onClick={() => handleDelete(listing)}
                            disabled={deleteMutation.isPending}
                            className="text-red-400 text-sm hover:text-red-600 hover:underline disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        )}
                        <Link
                          to={`/listings/${listing.id}`}
                          className="text-gray-400 text-sm hover:text-gray-600 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}