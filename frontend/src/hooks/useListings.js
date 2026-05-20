import { useQuery } from "@tanstack/react-query"
import { getListings, getMyListings } from "../api/listings"

export const useListings = (params) => {
  return useQuery({
    queryKey: ["listings", params],
    queryFn: async () => {
      const res = await getListings(params)
      // API returns { items, total, page, page_size, pages }
      return res.data
    },
  })
}

export const useMyListings = (params) => {
  return useQuery({
    queryKey: ["my-listings", params],
    queryFn: async () => {
      const res = await getMyListings(params)
      return res.data
    },
  })
}
