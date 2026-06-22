import { Link } from "react-router-dom"
import { CompactCountdown } from "./CountdownTimer"
import Badge from "../ui/Badge"
import { formatCurrency } from "../../utils/formatters"

const getImageUrl = (url) =>
  !url ? "" : url.startsWith("http") ? url : `http://localhost:8000${url}`

export default function ListingCard({ listing }) {
  const price = listing.current_price || listing.starting_price

  return (
    <Link to={`/listings/${listing.id}`} className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square overflow-hidden bg-gray-100 relative">
        {listing.image_urls?.[0] ? (
          <img
            src={getImageUrl(listing.image_urls[0])}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📦</div>
        )}
        {/* Countdown badge overlaid on image */}
        <div className="absolute bottom-2 left-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
            <CompactCountdown endsAt={listing.auction_end_time} />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <Badge status={listing.status} />
          <span className="text-xs text-gray-400">{listing.bid_count || 0} bids</span>
        </div>
        <h3 className="font-semibold text-gray-900 truncate mt-1">{listing.title}</h3>
        <div className="mt-2">
          <p className="text-xs text-gray-400">Current bid</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(price)}</p>
        </div>
      </div>
    </Link>
  )
}