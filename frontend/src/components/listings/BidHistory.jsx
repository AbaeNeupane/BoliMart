import { useQuery } from "@tanstack/react-query"
import { getBidHistory } from "../../api/bids"
import { formatCurrency, formatDate } from "../../utils/formatters"
import Skeleton from "../ui/Skeleton"

export default function BidHistory({ listingId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["bids", listingId],
    queryFn: () => getBidHistory(listingId),
    refetchInterval: 10000,
  })

  const bids = data?.data || []

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3">Bid history ({bids.length})</h3>
      {isLoading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : bids.length === 0 ? (
        <p className="text-sm text-gray-400">No bids yet — be the first!</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {bids.map((bid, i) => (
            <div key={bid.id} className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${i === 0 ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}>
              <div>
                <span className="font-medium text-gray-800">{bid.bidder?.full_name || "Anonymous"}</span>
                {i === 0 && <span className="ml-2 text-xs text-green-600 font-medium">Leading</span>}
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900">{formatCurrency(bid.amount)}</span>
                <span className="block text-xs text-gray-400">{formatDate(bid.placed_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
