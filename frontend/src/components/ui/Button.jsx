import Spinner from "./Spinner"

export default function Button({ children, variant = "primary", size = "md", loading, className = "", ...props }) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600",
  }
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && <Spinner className="w-4 h-4 mr-2" />}
      {children}
    </button>
  )
}
