import client from "./client"

export const getListings    = (params) => client.get("/listings/", { params })
export const getListing     = (id)     => client.get(`/listings/${id}`)
export const getMyListings  = (params) => client.get("/listings/my/listings", { params })
export const createListing  = (data)   => client.post("/listings/", data)
export const updateListing  = (id, data) => client.patch(`/listings/${id}`, data)
export const cancelListing  = (id)    => client.delete(`/listings/${id}`)
