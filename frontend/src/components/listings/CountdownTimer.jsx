import { useState, useEffect } from "react"

export default function CountdownTimer({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endsAt))

  function getTimeLeft(end) {
    if (!end) return { label: "—", urgent: false, ended: false }
    const endDate = new Date(end)
    if (isNaN(endDate.getTime())) return { label: "—", urgent: false, ended: false }
    const diff = endDate - new Date()
    if (diff <= 0) return { label: "Ended", urgent: false, ended: true }
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    const label = d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
    return { label, urgent: diff < 3600000, ended: false }
  }

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return (
    <span className={`font-mono text-xl font-bold ${
      timeLeft.ended ? "text-gray-400" : timeLeft.urgent ? "text-red-500 animate-pulse" : "text-primary-500"
    }`}>
      {timeLeft.label}
    </span>
  )
}