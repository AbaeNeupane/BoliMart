import client from "./client"

export const placeBid = (listingId, amount) => client.post("/bids", { listing_id: listingId, amount })
export const getBidHistory = (listingId) => client.get(`/bids/listing/${listingId}`)
export const getMyBids = () => client.get("/bids/my")
