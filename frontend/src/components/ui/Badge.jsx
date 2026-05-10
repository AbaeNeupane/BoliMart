const STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-700",
  ended: "bg-red-100 text-red-700",
  sold: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
}

export default function Badge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  )
}
