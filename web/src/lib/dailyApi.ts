/**
 * Client utility to fetch the daily company ID from the Netlify function
 */

export interface DailyResponse {
  yc_id: number;
}

/**
 * Fetch the daily company ID from the Netlify function
 * Returns null if function is unavailable (e.g., in local dev)
 */
export async function fetchDailyCompanyId(): Promise<number | null> {
  try {
    const response = await fetch('/.netlify/functions/daily');
    
    if (!response.ok) {
      return null; // Function unavailable
    }
    
    const data: DailyResponse = await response.json();
    
    if (typeof data.yc_id === 'number') {
      return data.yc_id;
    }
    
    return null;
  } catch (error) {
    // Function not available (e.g., local dev)
    return null;
  }
}

