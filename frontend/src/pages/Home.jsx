import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getListings } from "../api/listings"
import Navbar from "../components/layout/Navbar"
import ListingGrid from "../components/listings/ListingGrid"
import Spinner from "../components/ui/Spinner"
import Input from "../components/ui/Input"
import { useDebounce } from "../hooks/useDebounce"

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Sports", "Art", "Vehicles", "Other"]
const SORT_OPTIONS = [
  { label: "Ending soon", value: "ending_soon" },
  { label: "Newly listed", value: "newest" },
  { label: "Lowest price", value: "price_asc" },
  { label: "Highest price", value: "price_desc" },
]

export default function Home() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [sort, setSort] = useState("ending_soon")
  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading } = useQuery({
    queryKey: ["listings", debouncedSearch, category, sort],
    queryFn: () => getListings({ q: debouncedSearch, category, sort, status: "active" }),
  })

  const listings = data?.data || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Live Auctions</h1>
          <p className="text-gray-500 mb-6">Bid on unique items. Highest bid wins.</p>
          <div className="max-w-xl mx-auto">
            <Input
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === "All" ? "" : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  (cat === "All" && !category) || category === cat
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No listings found</div>
        ) : (
          <ListingGrid listings={listings} />
        )}
      </div>
    </div>
  )
}
