import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getListings } from "../api/listings"
import ListingGrid from "../components/listings/ListingGrid"
import Spinner from "../components/ui/Spinner"
import Input from "../components/ui/Input"
import { useDebounce } from "../hooks/useDebounce"

const CATEGORIES = ["All", "Electronics", "Fashion", "Home", "Sports", "Art", "Vehicles", "Other"]
const SORT_OPTIONS = [
  { label: "Ending soon",   value: "ending_soon" },
  { label: "Newly listed",  value: "newest" },
  { label: "Lowest price",  value: "price_asc" },
  { label: "Highest price", value: "price_desc" },
]

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)

  const [search, setSearch] = useState(() => params.get("q") || "")
  const [sort, setSort] = useState("ending_soon")
  const debouncedSearch = useDebounce(search, 400)

  const category = params.get("category") || ""
  const page = Number(params.get("page") || 1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", debouncedSearch, category, sort, page],
    queryFn: async () => {
      const res = await getListings({
        q: debouncedSearch,
        category: category || undefined,
        sort,
        status: "active",
        page,
      })
      return res.data   // { items, total, page, page_size, pages }
    },
    keepPreviousData: true,
  })

  const listings = data?.items || []
  const totalPages = data?.pages || 1

  const handleCategory = (cat) => {
    const nextParams = new URLSearchParams(location.search)
    if (cat === "All") {
      nextParams.delete("category")
    } else {
      nextParams.set("category", cat)
    }
    nextParams.delete("page")
    navigate(`/?${nextParams.toString()}`)
  }

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(location.search)
    if (newPage <= 1) {
      nextParams.delete("page")
    } else {
      nextParams.set("page", String(newPage))
    }
    navigate(`/?${nextParams.toString()}`)
  }

  const handleSort = (s) => {
    setSort(s)
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Live Auctions</h1>
          <p className="text-gray-500 mb-6">Bid on unique items. Highest bid wins.</p>
          <div className="max-w-xl mx-auto">
            <Input
              placeholder="Search listings..."
              value={search}
              onChange={handleSearch}
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
                onClick={() => handleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  (cat === "All" && !category) || category === cat
                    ? "bg-orange-500 text-white border-orange-500"
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
              onChange={(e) => handleSort(e.target.value)}
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
        ) : isError ? (
          <div className="text-center py-20 text-red-400">Failed to load listings. Is the backend running?</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No listings found</div>
        ) : (
          <ListingGrid listings={listings} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
