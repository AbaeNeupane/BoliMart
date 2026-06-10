import { formatDistanceToNow, format, isPast } from "date-fns"

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount ?? 0)

export const formatDate = (date) => {
  if (!date) return "—"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "—"
  return format(d, "MMM d, yyyy h:mm a")
}

export const formatTimeLeft = (endsAt) => {
  if (!endsAt) return "—"
  const d = new Date(endsAt)
  if (isNaN(d.getTime())) return "—"
  if (isPast(d)) return "Ended"
  return formatDistanceToNow(d, { addSuffix: true })
}

export const formatBidIncrement = (currentPrice, minPrice) => {
  const floor = currentPrice || minPrice
  return parseFloat((floor + 0.10).toFixed(2))
}