// ============================================================================
// BILLEASE SAAS — NETWORK ERROR DETECTOR
// Accurately distinguishes network/connection errors from validation & auth errors
// ============================================================================

/**
 * Inspects an error or response to determine if it was caused by network connectivity loss.
 * Returns FALSE for server-side validation errors, auth failures, or database constraint violations.
 */
export function isNetworkError(error: any): boolean {
  if (typeof window !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (!error) return false;

  // Standard network exception names
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return true;
  }

  const message = String(error.message || error.details || error || "").toLowerCase();

  // Explicit network error strings
  const networkKeywords = [
    "failed to fetch",
    "networkerror",
    "network request failed",
    "network error",
    "err_internet_disconnected",
    "err_connection_refused",
    "err_connection_timed_out",
    "err_name_not_resolved",
    "fetch failed",
    "load failed",
    "connection refused",
    "connection timed out",
    "gateway timeout",
    "offline",
  ];

  if (networkKeywords.some((keyword) => message.includes(keyword))) {
    return true;
  }

  // Supabase / PostgREST specific network error (code empty or 0)
  if (error.code === "" || error.code === "0" || error.status === 0 || error.status === 504) {
    return true;
  }

  // Known non-retriable database / validation error codes (PostgreSQL)
  // 23505: Unique violation
  // 23503: Foreign key violation
  // 42501: RLS / Permission denied
  // 22P02: Invalid text representation
  const validationCodes = ["23505", "23503", "42501", "22P02", "PGRST116", "PGRST204"];
  if (validationCodes.includes(error.code)) {
    return false;
  }

  // HTTP status checks: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 422 (Unprocessable)
  if (error.status && [400, 401, 403, 409, 422].includes(error.status)) {
    return false;
  }

  return false;
}
