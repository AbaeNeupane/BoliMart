import { useState, useEffect, useRef } from "react"

function getTimeLeft(endsAt) {
  if (!endsAt) return null
  const endDate = new Date(endsAt)
  if (isNaN(endDate.getTime())) return null
  const diff = endDate - Date.now()
  if (diff <= 0) return { ended: true, urgent: false, veryUrgent: false, d: 0, h: 0, m: 0, s: 0, diff: 0 }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return {
    ended: false,
    urgent: diff < 3600000,       // < 1 hour
    veryUrgent: diff < 300000,    // < 5 minutes
    d, h, m, s, diff,
  }
}

// ── Compact variant — used on listing cards ──────────────────────────────────
export function CompactCountdown({ endsAt }) {
  const [t, setT] = useState(() => getTimeLeft(endsAt))
  const endsAtRef = useRef(endsAt)

  useEffect(() => {
    endsAtRef.current = endsAt
    const id = setInterval(() => setT(getTimeLeft(endsAtRef.current)), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (!t) return null
  if (t.ended) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Ended
    </span>
  )

  const label = t.d > 0
    ? `${t.d}d ${t.h}h`
    : t.h > 0
    ? `${t.h}h ${t.m}m`
    : `${t.m}m ${t.s}s`

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold font-mono
      ${t.veryUrgent ? "text-red-500 animate-pulse" : t.urgent ? "text-orange-500" : "text-primary-500"}`}>
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  )
}

// ── Full variant — used on listing detail page ───────────────────────────────
export default function CountdownTimer({ endsAt, onEnd }) {
  const [t, setT] = useState(() => getTimeLeft(endsAt))
  const onEndRef = useRef(onEnd)
  const endsAtRef = useRef(endsAt)
  onEndRef.current = onEnd
  endsAtRef.current = endsAt

  useEffect(() => {
    const id = setInterval(() => {
      const next = getTimeLeft(endsAtRef.current)
      setT(next)
      if (next?.ended) {
        clearInterval(id)
        onEndRef.current?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (!t) return null

  if (t.ended) return (
    <div className="text-center">
      <p className="text-sm text-gray-400 uppercase tracking-wide mb-1">Auction ended</p>
      <span className="text-2xl font-bold text-gray-400">—</span>
    </div>
  )

  // Show segmented blocks when < 1 day remaining
  if (t.d === 0) {
    const segments = t.h > 0
      ? [{ label: "hrs",  value: t.h }, { label: "min", value: t.m }, { label: "sec", value: t.s }]
      : [{ label: "min", value: t.m }, { label: "sec", value: t.s }]

    return (
      <div>
        <div className="flex items-end gap-1">
          {segments.map(({ label, value }, i) => (
            <div key={label} className="flex items-end gap-1">
              <div className={`flex flex-col items-center px-2 py-1 rounded-lg min-w-[44px]
                ${t.veryUrgent ? "bg-red-50" : t.urgent ? "bg-orange-50" : "bg-primary-50"}`}>
                <span className={`text-2xl font-bold font-mono tabular-nums leading-tight
                  ${t.veryUrgent ? "text-red-600" : t.urgent ? "text-orange-500" : "text-primary-600"}`}>
                  {String(value).padStart(2, "0")}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-widest
                  ${t.veryUrgent ? "text-red-400" : t.urgent ? "text-orange-400" : "text-primary-400"}`}>
                  {label}
                </span>
              </div>
              {i < segments.length - 1 && (
                <span className={`text-xl font-bold mb-2
                  ${t.veryUrgent ? "text-red-400" : t.urgent ? "text-orange-400" : "text-primary-400"}`}>
                  :
                </span>
              )}
            </div>
          ))}
        </div>
        {t.veryUrgent && (
          <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">⚡ Ending very soon!</p>
        )}
        {t.urgent && !t.veryUrgent && (
          <p className="text-xs text-orange-500 font-medium mt-1">🔥 Less than 1 hour left</p>
        )}
      </div>
    )
  }

  // More than 1 day — simple text display
  return (
    <div>
      <span className="text-2xl font-bold font-mono text-primary-600">
        {t.d}d {t.h}h {t.m}m
      </span>
      <p className="text-xs text-gray-400 mt-0.5">
        Ends {new Date(endsAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  )
}