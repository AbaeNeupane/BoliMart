import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getListing } from "../api/listings"
import { placeBid } from "../api/bids"
import { useAuctionSocket } from "../hooks/useAuctionSocket"
import { useAuthStore } from "../store/authStore"
import CountdownTimer from "../components/listings/CountdownTimer"
import BidHistory from "../components/listings/BidHistory"
import BidForm from "../components/listings/BidForm"
import ImageGallery from "../components/listings/ImageGallery"
import Badge from "../components/ui/Badge"
import Spinner from "../components/ui/Spinner"
import { formatCurrency, formatDate } from "../utils/formatters"
import toast from "react-hot-toast"
import { useState } from "react"

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [livePrice, setLivePrice] = useState(null)
  const [auctionEnded, setAuctionEnded] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
    refetchInterval: 30000,
  })

  const listing = data?.data

  // Live bid updates via WebSocket
  useAuctionSocket(id, (bidData) => {
    setLivePrice(bidData.bid_amount)
    queryClient.invalidateQueries(["bids", id])
    if (bidData.bidder_id !== user?.id) {
      toast("New bid placed!", { icon: "🔔" })
    }
  })

  const bidMutation = useMutation({
    mutationFn: (amount) => placeBid(id, amount),
    onSuccess: () => {
      toast.success("Bid placed successfully!")
      queryClient.invalidateQueries(["listing", id])
    },
    onError: (err) => toast.error(err.response?.data?.detail || "Failed to place bid"),
  })

  // Called by CountdownTimer when the clock hits zero
  const handleAuctionEnd = () => {
    setAuctionEnded(true)
    toast("Auction has ended", { icon: "🏁" })
    // Refetch to get final status from server
    queryClient.invalidateQueries(["listing", id])
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-center pt-20"><Spinner /></div>
    </div>
  )
  if (!listing) return null

  const currentPrice = livePrice || listing.current_price || listing.starting_price
  const isActive = listing.status === "active" && !auctionEnded
  const canBid = user && listing.seller_id && String(user.id) !== String(listing.seller_id)
  const categoryName = listing.category?.name ?? listing.category ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left — Images */}
          <div>
            <ImageGallery images={listing.image_urls} />
          </div>

          {/* Right — Details + Bidding */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge status={auctionEnded ? "ended" : listing.status} />
                {categoryName && (
                  <span className="text-xs text-gray-400">{categoryName}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
              <p className="text-gray-500 mt-2">{listing.description}</p>
            </div>

            {/* Price + Timer card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-5">
                {/* Price */}
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Current bid</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(currentPrice)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Starting price: {formatCurrency(listing.starting_price)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {listing.bid_count || 0} {listing.bid_count === 1 ? "bid" : "bids"}
                  </p>
                </div>

                {/* Countdown */}
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Time left</p>
                  <CountdownTimer
                    endsAt={listing.auction_end_time}
                    onEnd={handleAuctionEnd}
                  />
                </div>
              </div>

              {/* Bid form */}
              {isActive && canBid && user && (
                <BidForm
                  currentPrice={currentPrice}
                  minPrice={listing.starting_price}
                  onSubmit={(amount) => bidMutation.mutate(amount)}
                  loading={bidMutation.isPending}
                />
              )}

              {!user && isActive && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  <a href="/login" className="text-primary-500 font-medium">Sign in</a> to place a bid
                </p>
              )}

              {!isActive && (
                <div className="mt-3 py-3 px-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-sm font-medium text-gray-500">
                    🏁 This auction has ended
                  </p>
                </div>
              )}

              {isActive && user && !canBid && (
                <p className="text-center text-sm text-gray-400 mt-3">
                  You cannot bid on your own listing
                </p>
              )}
            </div>

            {/* Listing info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-sm text-gray-500 space-y-2">
              <p>Listed by <span className="font-medium text-gray-700">{listing.seller?.full_name}</span></p>
              <p>Started <span className="text-gray-700">{formatDate(listing.starts_at)}</span></p>
              <p>Ends <span className="text-gray-700">{formatDate(listing.auction_end_time)}</span></p>
              {listing.condition && (
                <p>Condition <span className="font-medium text-gray-700 capitalize">{listing.condition}</span></p>
              )}
              {listing.location && (
                <p>Location <span className="font-medium text-gray-700">{listing.location}</span></p>
              )}
              {listing.shipping_available && (
                <p className="text-green-600 font-medium">✓ Shipping available</p>
              )}
            </div>

            {/* Bid history */}
            <BidHistory listingId={id} />
          </div>
        </div>
      </div>
    </div>
  )
}