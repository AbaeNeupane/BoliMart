import { useState } from "react"
import { formatCurrency, formatBidIncrement } from "../../utils/formatters"
import Button from "../ui/Button"

export default function BidForm({ currentPrice, minPrice, onSubmit, loading }) {
  const minBid = formatBidIncrement(currentPrice, minPrice)
  const [amount, setAmount] = useState(minBid)
  const [error, setError] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (parseFloat(amount) < minBid) {
      setError(`Minimum bid is ${formatCurrency(minBid)}`)
      return
    }
    setError("")
    onSubmit(parseFloat(amount))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          Your bid (min {formatCurrency(minBid)})
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="number"
              step="0.01"
              min={minBid}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button type="submit" loading={loading}>Place bid</Button>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    </form>
  )
}
