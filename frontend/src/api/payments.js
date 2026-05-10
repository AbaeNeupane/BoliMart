import client from "./client"

export const startStripeOnboarding = () => client.post("/payments/connect/onboard")
export const getStripeStatus = () => client.get("/payments/connect/status")
export const createCheckout = (listingId) => client.post(`/payments/checkout/${listingId}`)
export const getTransactions = () => client.get("/payments/transactions")
