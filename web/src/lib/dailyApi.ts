/**
 * Client utility to fetch the daily company ID from the Netlify function
 */

export interface DailyResponse {
  yc_id: number;
}

/**
 * Fetch the daily company ID from the Netlify function
 */
export async function fetchDailyCompanyId(): Promise<number> {
  try {
    const response = await fetch('/.netlify/functions/daily');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch daily company: ${response.status} ${response.statusText}`);
    }
    
    const data: DailyResponse = await response.json();
    
    if (typeof data.yc_id !== 'number') {
      throw new Error('Invalid response: yc_id is not a number');
    }
    
    return data.yc_id;
  } catch (error) {
    console.error('Error fetching daily company:', error);
    throw error;
  }
}

