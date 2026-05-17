import ListingCard from "./ListingCard"

export default function ListingGrid({ listings }) {
  if (!Array.isArray(listings)) {
    console.error("ListingGrid: expected listings to be an array", listings)
    return <div className="text-center text-gray-500">Unable to display listings</div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
