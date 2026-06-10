import { useParams } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { getListing } from "../../api/listings"
import { createCheckout } from "../../api/payments"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import Navbar from "../../components/layout/Navbar"
import Button from "../../components/ui/Button"
import Spinner from "../../components/ui/Spinner"
import { formatCurrency } from "../../utils/formatters"
import toast from "react-hot-toast"
import { useState } from "react"

// stripePromise will be null if the env var is missing — we handle that below
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

function CheckoutForm({ listing, clientSecret }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) {
      toast.error("Stripe is not loaded yet. Please refresh and try again.")
      return
    }
    setLoading(true)
    setPaymentError(null)

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    })

    setLoading(false)

    if (result.error) {
      setPaymentError(result.error.message)
      toast.error(result.error.message)
    } else if (result.paymentIntent.status === "succeeded") {
      setPaymentSuccess(true)
      toast.success("Payment successful! 🎉")
    }
  }

  if (paymentSuccess) {
    return (
      <div className="text-center py-6">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-green-600 text-lg">Payment successful!</p>
        <p className="text-sm text-gray-500 mt-1">The seller will be in touch shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#374151" },
              invalid: { color: "#EF4444" },
            },
          }}
        />
      </div>
      {paymentError && (
        <p className="text-sm text-red-500">{paymentError}</p>
      )}
      <Button type="submit" loading={loading} disabled={!stripe || loading} className="w-full">
        Pay {formatCurrency(listing.current_price || listing.starting_price)}
      </Button>
      <p className="text-xs text-center text-gray-400">
        Secured by Stripe. Your card details are never stored.
      </p>
    </form>
  )
}

export default function Checkout() {
  const { listingId } = useParams()
  const [clientSecret, setClientSecret] = useState(null)
  const [checkoutError, setCheckoutError] = useState(null)

  const { data, isLoading: listingLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => getListing(listingId),
  })
  const listing = data?.data

  const intentMutation = useMutation({
    mutationFn: () => createCheckout(listingId),
    onSuccess: (res) => {
      setClientSecret(res.data.client_secret)
      setCheckoutError(null)
    },
    onError: (err) => {
      // Extract the real error message from the backend response
      const detail = err.response?.data?.detail || "Could not initiate payment"
      setCheckoutError(detail)
      toast.error(detail)
    },
  })

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center pt-20"><Spinner /></div>
      </div>
    )
  }

  if (!listing) return null

  // Guard: only the auction winner should be here
  const isEnded = listing.status === "sold" || listing.status === "ended"

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        {/* Missing Stripe key warning (dev only) */}
        {!stripeKey && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            ⚠️ <strong>VITE_STRIPE_PUBLISHABLE_KEY</strong> is missing from your{" "}
            <code className="font-mono">frontend/.env</code>. Payment will not work until it is set.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Order summary</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Item</p>
                <p className="font-medium text-gray-900">{listing.title}</p>
              </div>
              {listing.seller && (
                <div>
                  <p className="text-gray-600 text-sm">Seller</p>
                  <p className="font-medium text-gray-900">{listing.seller.full_name}</p>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Winning bid</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(listing.current_price || listing.starting_price)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Payment method</h2>

            {clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm listing={listing} clientSecret={clientSecret} />
              </Elements>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setCheckoutError(null)
                    intentMutation.mutate()
                  }}
                  loading={intentMutation.isPending}
                  disabled={intentMutation.isPending || !stripeKey}
                  className="w-full"
                >
                  Initialize payment
                </Button>

                {/* Show backend error clearly instead of spinning forever */}
                {checkoutError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {checkoutError === "Seller has not completed payout setup" ? (
                      <>
                        The seller hasn't connected their Stripe account yet.
                        Payment will be available once they complete their payout setup.
                      </>
                    ) : (
                      checkoutError
                    )}
                  </div>
                )}

                {!isEnded && (
                  <p className="text-xs text-center text-amber-600">
                    This auction hasn't ended yet — only the winner can checkout.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}