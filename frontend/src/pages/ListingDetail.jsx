import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getListing } from "../api/listings"
import { placeBid } from "../api/bids"
import { useAuctionSocket } from "../hooks/useAuctionSocket"
import { useAuthStore } from "../store/authStore"
import Navbar from "../components/layout/Navbar"
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

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
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

  if (isLoading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex justify-center pt-20"><Spinner /></div></div>
  if (!listing) return null

  const currentPrice = livePrice || listing.current_price || listing.starting_price
  const canBid = user && (user.role !== "seller" || user?.id !== listing.seller_id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
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
                <Badge status={listing.status} />
                {listing.category && (
                  <span className="text-xs text-gray-400">{listing.category}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
              <p className="text-gray-500 mt-2">{listing.description}</p>
            </div>

            {/* Price + Timer */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Current bid</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(currentPrice)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Starting price: {formatCurrency(listing.starting_price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Time left</p>
                  {/* Fixed: was listing.ends_at — correct DB column is auction_end_time */}
                  <CountdownTimer endsAt={listing.auction_end_time} />
                </div>
              </div>

              {/* Bid form */}
              {listing.status === "active" && canBid && user && (
                <BidForm
                  currentPrice={currentPrice}
                  minPrice={listing.starting_price}
                  onSubmit={(amount) => bidMutation.mutate(amount)}
                  loading={bidMutation.isPending}
                />
              )}
              {!user && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  <a href="/login" className="text-primary-500 font-medium">Sign in</a> to place a bid
                </p>
              )}
              {listing.status !== "active" && (
                <p className="text-center text-sm font-medium text-gray-500 mt-3">
                  This auction has ended
                </p>
              )}
            </div>

            {/* Info */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>Listed by <span className="font-medium text-gray-700">{listing.seller?.full_name}</span></p>
              <p>Started {formatDate(listing.starts_at)}</p>
              {/* Fixed: was listing.ends_at — correct DB column is auction_end_time */}
              <p>Ends {formatDate(listing.auction_end_time)}</p>
            </div>

            {/* Bid history */}
            <BidHistory listingId={id} />
          </div>
        </div>
      </div>
    </div>
  )
}