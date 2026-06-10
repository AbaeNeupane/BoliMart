import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { getMyBids } from "../../api/bids"
import client from "../../api/client"
import Badge from "../../components/ui/Badge"
import Button from "../../components/ui/Button"
import { formatCurrency, formatDate } from "../../utils/formatters"
import toast from "react-hot-toast"

export default function MyBids() {
  const queryClient = useQueryClient()

  const { data } = useQuery({ queryKey: ["my-bids"], queryFn: getMyBids })
  const bids = data?.data || []

  const cancelMutation = useMutation({
    mutationFn: (bidId) => client.delete(`/bids/${bidId}`),
    onSuccess: () => {
      toast.success("Bid cancelled")
      queryClient.invalidateQueries(["my-bids"])
    },
    onError: (err) => {
      const detail = err.response?.data?.detail
      toast.error(detail || "Failed to cancel bid")
    },
  })

  const handleCancel = (bid) => {
    if (!window.confirm("Cancel this bid? The next highest bidder will become the winner.")) return
    cancelMutation.mutate(bid.id)
  }

  const won    = bids.filter((b) => b.status === "won")
  const active = bids.filter((b) => b.status === "active")
  const outbid = bids.filter((b) => b.status === "outbid")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bids</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active bids",  value: active.length, color: "text-blue-600" },
            { label: "Won",          value: won.length,    color: "text-green-600" },
            { label: "Outbid",       value: outbid.length, color: "text-red-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {won.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">🏆 Won auctions — action needed</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {won.map((bid) => (
                <div key={bid.id} className="p-4 border-b border-gray-100 last:border-b-0 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{bid.listing?.title}</p>
                    <p className="text-sm text-gray-500">Your winning bid: {formatCurrency(bid.amount)}</p>
                  </div>
                  <Link to={`/checkout/${bid.listing_id}`}>
                    <Button size="sm">Complete checkout</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">All bids ({bids.length})</h2>
          </div>
          {bids.length === 0 ? (
            <div className="p-10 text-center text-gray-400">You haven't placed any bids yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Item</th>
                  <th className="text-left px-5 py-3">Your bid</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      <Link to={`/listings/${bid.listing_id}`} className="text-primary-500 hover:underline">
                        View listing
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-gray-900 font-semibold">
                      {formatCurrency(bid.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={bid.status} />
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(bid.placed_at)}</td>
                    <td className="px-5 py-4">
                      {bid.status === "active" && (
                        <button
                          onClick={() => handleCancel(bid)}
                          disabled={cancelMutation.isPending}
                          className="text-red-400 text-sm hover:text-red-600 hover:underline disabled:opacity-40"
                        >
                          Cancel bid
                        </button>
                      )}
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