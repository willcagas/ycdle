/**
 * Daily mode utilities
 * 
 * Handles fetching the daily company ID from the Netlify function
 * and determining if daily mode should be used.
 */

import { isDailyMode } from './detection'
import { API_PATHS } from '../core'

export interface DailyResponse {
  yc_id: number;
}

/**
 * Fetch the daily company ID from the Netlify function
 * Returns null if function is unavailable (e.g., in local dev)
 */
export async function fetchDailyCompanyId(): Promise<number | null> {
  try {
    const response = await fetch(API_PATHS.DAILY_FUNCTION);
    
    if (!response.ok) {
      return null; // Function unavailable
    }
    
    const data: DailyResponse = await response.json();
    
    if (typeof data.yc_id === 'number') {
      return data.yc_id;
    }
    
    return null;
  } catch {
    // Function not available (e.g., local dev)
    return null;
  }
}

/**
 * Check if daily mode should be used
 * Returns true if in daily mode AND the daily function is available
 */
export async function shouldUseDailyMode(): Promise<boolean> {
  if (!isDailyMode()) {
    return false;
  }
  
  const ycId = await fetchDailyCompanyId();
  return ycId !== null;
}

