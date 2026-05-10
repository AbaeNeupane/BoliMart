import { useQuery } from "@tanstack/react-query"
import { getMyBids, getBidHistory } from "../api/bids"

export const useBids = () => {
  return useQuery({
    queryKey: ["my-bids"],
    queryFn: getMyBids,
  })
}

export const useBidHistory = (listingId) => {
  return useQuery({
    queryKey: ["bids", listingId],
    queryFn: () => getBidHistory(listingId),
    refetchInterval: 10000,
  })
}
