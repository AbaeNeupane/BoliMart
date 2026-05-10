import { useParams } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { getListing } from "../../api/listings"
import { createCheckout } from "../../api/payments"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import Navbar from "../../components/layout/Navbar"
import Button from "../../components/ui/Button"
import { formatCurrency } from "../../utils/formatters"
import toast from "react-hot-toast"
import { useState } from "react"

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function CheckoutForm({ listing, clientSecret }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    })
    setLoading(false)
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success("Payment successful! 🎉")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 rounded-lg p-4">
        <CardElement className="p-2" />
      </div>
      <Button type="submit" loading={loading} className="w-full">
        Pay {formatCurrency(listing.current_price || listing.min_price)}
      </Button>
    </form>
  )
}

export default function Checkout() {
  const { listingId } = useParams()
  const [clientSecret, setClientSecret] = useState(null)

  const { data } = useQuery({ queryKey: ["listing", listingId], queryFn: () => getListing(listingId) })
  const listing = data?.data

  const intentMutation = useMutation({
    mutationFn: () => createCheckout(listingId),
    onSuccess: (res) => setClientSecret(res.data.client_secret),
    onError: () => toast.error("Could not initiate payment"),
  })

  if (!listing) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Order summary</h2>
            <div className="space-y-3">
              <div><p className="text-gray-600">Item</p><p className="font-medium text-gray-900">{listing.title}</p></div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">Winning bid</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(listing.current_price || listing.min_price)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Payment method</h2>
            {clientSecret && stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm listing={listing} clientSecret={clientSecret} />
              </Elements>
            ) : (
              <Button onClick={() => intentMutation.mutate()} loading={intentMutation.isPending} className="w-full">
                Initialize payment
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
