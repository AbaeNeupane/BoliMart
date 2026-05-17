export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/v1"

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
}

export const LISTING_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  ENDED: "ended",
  SOLD: "sold",
  CANCELLED: "cancelled",
}

export const BID_STATUS = {
  ACTIVE: "active",
  OUTBID: "outbid",
  WON: "won",
  LOST: "lost",
}
