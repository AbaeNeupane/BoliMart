/**
 * Extract user-friendly error message from API response
 * Handles Pydantic validation errors, standard error responses, and network errors
 */
export function getErrorMessage(error) {
  if (!error) {
    return "An unexpected error occurred"
  }

  // Network error / no response
  if (!error.response) {
    if (error.message === "Network Error") {
      return "Network error. Please check your internet connection."
    }
    return error.message || "Connection failed"
  }

  const { status, data } = error.response

  // Handle validation errors (Pydantic returns array of errors)
  if (status === 422 && Array.isArray(data.detail)) {
    const messages = data.detail
      .map((err) => {
        const field = err.loc?.[1] || "Field"
        const msg = err.msg || "Invalid value"
        return `${field}: ${msg}`
      })
      .join("; ")
    return messages || "Validation failed"
  }

  // Handle standard error response with detail field
  if (data?.detail) {
    if (typeof data.detail === "string") {
      return data.detail
    }
    if (typeof data.detail === "object") {
      return JSON.stringify(data.detail)
    }
  }

  // Handle error response with message field
  if (data?.message) {
    return data.message
  }

  // HTTP status-based fallback
  switch (status) {
    case 400:
      return data?.message || "Bad request"
    case 401:
      return "You are not authenticated. Please log in."
    case 403:
      return "You don't have permission to perform this action."
    case 404:
      return "The requested resource was not found."
    case 409:
      return "Conflict: This resource already exists."
    case 422:
      return "Invalid input. Please check your data."
    case 429:
      return "Too many requests. Please wait a moment and try again."
    case 500:
      return "Server error. Please try again later."
    case 502:
      return "Service temporarily unavailable. Please try again later."
    case 503:
      return "Service is under maintenance. Please try again later."
    default:
      return `Error: ${status} ${error.response.statusText || "Unknown"}`
  }
}

/**
 * Format error for display in UI
 * Extracts message and provides user-friendly guidance
 */
export function formatErrorForDisplay(error) {
  const message = getErrorMessage(error)

  // Add actionable guidance for specific error types
  if (message.includes("not authenticated") || message.includes("401")) {
    return {
      title: "Authentication Required",
      message: "Please log in to continue.",
      action: "Log In",
    }
  }

  if (message.includes("permission") || message.includes("403")) {
    return {
      title: "Access Denied",
      message: "You don't have permission to perform this action.",
      action: null,
    }
  }

  if (message.includes("not found") || message.includes("404")) {
    return {
      title: "Not Found",
      message: "The resource you're looking for doesn't exist.",
      action: "Go Back",
    }
  }

  if (message.includes("network") || message.includes("Network")) {
    return {
      title: "Connection Error",
      message: "Check your internet connection and try again.",
      action: "Retry",
    }
  }

  if (message.includes("Validation") || message.includes("Invalid")) {
    return {
      title: "Invalid Input",
      message,
      action: "Fix and Retry",
    }
  }

  return {
    title: "Error",
    message,
    action: "Retry",
  }
}
