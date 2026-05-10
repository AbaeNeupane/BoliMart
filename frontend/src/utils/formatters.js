import { formatDistanceToNow, format, isPast } from "date-fns"

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)

export const formatDate = (date) => format(new Date(date), "MMM d, yyyy h:mm a")

export const formatTimeLeft = (endsAt) => {
  if (isPast(new Date(endsAt))) return "Ended"
  return formatDistanceToNow(new Date(endsAt), { addSuffix: true })
}

export const formatBidIncrement = (currentPrice, minPrice) => {
  const floor = currentPrice || minPrice
  return parseFloat((floor * 1.05).toFixed(2))
}
