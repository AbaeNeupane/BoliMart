import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import client from "../api/client"

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  // Initialize directly from token so we never call setState synchronously
  // inside the effect body
  const [status, setStatus] = useState(() => (token ? "verifying" : "no_token"))

  useEffect(() => {
    if (!token) return

    client.post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        const detail = err.response?.data?.detail || ""
        setStatus(detail.includes("expired") ? "expired" : "error")
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">

        {status === "verifying" && (
          <>
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900">Verifying your email...</h1>
            <p className="text-sm text-gray-500 mt-2">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your account is now active. You can sign in and start bidding.
            </p>
            <Link
              to="/login"
              className="inline-block w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Sign in
            </Link>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link expired</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your verification link has expired. Request a new one below.
            </p>
            <ResendForm />
          </>
        )}

        {(status === "error" || status === "no_token") && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid link</h1>
            <p className="text-gray-500 text-sm mb-6">
              This verification link is invalid or has already been used.
            </p>
            <ResendForm />
          </>
        )}
      </div>
    </div>
  )
}

function ResendForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleResend = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError("")
    try {
      await client.post("/auth/resend-verification", null, { params: { email } })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700">
        ✅ Verification email sent to <strong>{email}</strong>. Check your inbox.
      </div>
    )
  }

  return (
    <form onSubmit={handleResend} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        required
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {loading ? "Sending..." : "Resend verification email"}
      </button>
      <Link to="/login" className="block text-sm text-center text-gray-500 hover:text-gray-700">
        Back to sign in
      </Link>
    </form>
  )
}