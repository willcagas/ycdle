/**
 * Centralized configuration and environment variable access
 */

/**
 * API paths
 */
export const API_PATHS = {
  DAILY_FUNCTION: '/.netlify/functions/daily',
} as const;

/**
 * Get the daily seed from environment variable
 * 
 * Note: This is only used in the Netlify function (server-side).
 * Documented here for reference and consistency.
 * 
 * In browser context, this always returns the default value.
 * The actual environment variable is read in the Netlify function.
 * 
 * @returns The daily seed string, or default if not set
 */
export function getDailySeed(): string {
  // Only used in Netlify function, but documented here
  // In browser context, this will always return the default
  // The Netlify function reads: process.env.YC_DAILY_SEED || 'yc-battle-v1'
  return 'yc-battle-v1';
}

