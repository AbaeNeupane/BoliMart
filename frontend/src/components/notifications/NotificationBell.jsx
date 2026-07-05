import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { getNotifications, getUnreadCount, markRead, markAllRead } from "../../api/notifications"

const TYPE_ICON = {
  outbid:        "😬",
  auction_won:   "🎉",
  auction_ended: "🏁",
  new_bid:       "💰",
  bid_cancelled: "❌",
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const queryClient = useQueryClient()

  const { data: countData } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: getUnreadCount,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  })

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: open,
    staleTime: 0,
  })

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"])
      queryClient.invalidateQueries(["notifications-count"])
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"])
      queryClient.invalidateQueries(["notifications-count"])
    },
  })

  const unread = countData?.data?.count ?? 0
  const notifications = notifData?.data?.data ?? []

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen((o) => {
            if (!o) refetchNotifs()
            return !o
          })
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded border-2 border-transparent hover:border-gray-500 text-white transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications {unread > 0 && <span className="text-primary-500">({unread})</span>}
              </h3>
              {unread > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <span className="text-3xl mb-2">🔔</span>
                  <p className="text-sm text-gray-400">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markReadMutation.mutate(n.id)
                    }}
                    className={`flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors
                      ${!n.is_read ? "bg-primary-50/40" : ""}`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                        {n.listing_id && (
                          <Link
                            to={`/listings/${n.listing_id}`}
                            onClick={() => setOpen(false)}
                            className="text-[10px] text-primary-500 hover:underline font-medium"
                          >
                            View listing →
                          </Link>
                        )}
                      </div>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </>
      )}
    </div>
  )
}