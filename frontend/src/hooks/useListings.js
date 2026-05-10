import { useQuery } from "@tanstack/react-query"
import { getListings } from "../api/listings"

export const useListings = (params) => {
  return useQuery({
    queryKey: ["listings", params],
    queryFn: () => getListings(params),
  })
}
