import ListingCard from "./ListingCard"

export default function ListingGrid({ listings, emptyMessage }) {
  if (!Array.isArray(listings)) {
    console.error("ListingGrid: expected listings to be an array", listings)
    return <div className="text-center text-gray-500">Unable to display listings</div>
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-3xl">
          🔍
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No listings found</h3>
        <p className="text-sm text-gray-400 max-w-xs">
          {emptyMessage || "Try a different search or category."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}