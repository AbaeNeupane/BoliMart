import { forwardRef } from "react"

const Input = forwardRef(({ label, error, className = "", ...props }, ref) => (
  <div>
    {label && <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
))
Input.displayName = "Input"
export default Input
