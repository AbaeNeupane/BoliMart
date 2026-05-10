import { useQuery } from "@tanstack/react-query"
import client from "../../api/client"
import Navbar from "../../components/layout/Navbar"
import { Link } from "react-router-dom"
import { formatCurrency } from "../../utils/formatters"

export default function AdminDashboard() {
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => client.get("/admin/stats") })
  const stats = data?.data || {}

  const cards = [
    { label: "Total users", value: stats.total_users, link: "/admin/users" },
    { label: "Active auctions", value: stats.active_listings, link: "/admin/listings" },
    { label: "Total commission", value: formatCurrency(stats.total_commission || 0), link: "/admin/transactions" },
    { label: "Transactions", value: stats.total_transactions, link: "/admin/transactions" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Link key={card.link} to={card.link} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-400">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
