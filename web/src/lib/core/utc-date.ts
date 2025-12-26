/**
 * UTC date utilities for solve counter
 * 
 * Provides dateKey in YYYY-MM-DD format for UTC timezone.
 * This matches the daily puzzle reset time (UTC midnight).
 */

/**
 * Get UTC dateKey (YYYY-MM-DD format)
 * Uses UTC timezone to match the daily puzzle reset time
 */
export function getUTCDateKey(): string {
  const now = new Date();
  // Get UTC date components
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * @deprecated Use getUTCDateKey() instead. Kept for backwards compatibility.
 */
export function getHawaiiDateKey(): string {
  return getUTCDateKey();
}

