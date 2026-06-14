import { useState } from "react"
import toast from "react-hot-toast"

/**
 * Display API errors with user-friendly messages and retry functionality
 */
export function ApiError({ error, onRetry, retryLabel = "Retry" }) {
  const [isRetrying, setIsRetrying] = useState(false)

  if (!error) return null

  const handleRetry = async () => {
    if (!onRetry) return
    setIsRetrying(true)
    try {
      await onRetry()
      toast.success("Retry successful!")
    } catch (err) {
      console.error("Retry failed:", err)
      toast.error("Retry failed. Please try again.")
    } finally {
      setIsRetrying(false)
    }
  }

  const message = error.userMessage || error.message || "An error occurred"
  const isRetryable = error.retryable || (error.response?.status >= 500)

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <span className="text-red-600 text-xl">⚠️</span>
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-red-800 mb-1">Error</h3>
          <p className="text-red-700 text-sm mb-3">{message}</p>
          {isRetryable && onRetry && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400"
            >
              {isRetrying ? "Retrying..." : retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton with error state and retry
 */
export function LoadingState({ isLoading, error, children, onRetry }) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    )
  }

  if (error) {
    return <ApiError error={error} onRetry={onRetry} />
  }

  return children
}

/**
 * Async data fetcher with built-in loading, error, and retry states
 */
export function useAsyncData(fetchFn, { onSuccess, onError } = {}) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetch = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result)
      onSuccess?.(result)
      return result
    } catch (err) {
      setError(err)
      onError?.(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const retry = () => fetch()

  return { data, isLoading, error, fetch, retry }
}
