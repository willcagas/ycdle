/**
 * Netlify Function: Get Daily Solve Stats
 * 
 * GET /.netlify/functions/ycdle-stats?date=YYYY-MM-DD
 * 
 * Returns the solve count for the given dateKey.
 * Uses Netlify Blobs site-wide store for persistence across deploys.
 */

import { getStore } from '@netlify/blobs';

interface StatsResponse {
  dateKey: string;
  solves: number;
}

/**
 * Get UTC dateKey (YYYY-MM-DD format)
 * Uses UTC timezone to match the daily puzzle reset time
 */
function getUTCDateKey(): string {
  const now = new Date();
  // Get UTC date components
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Netlify Function Handler
 */
export async function handler(event: { httpMethod: string; queryStringParameters?: { date?: string } }): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get dateKey from query parameter or default to today (UTC)
    let dateKey = event.queryStringParameters?.date;
    
    if (!dateKey) {
      dateKey = getUTCDateKey();
    }

    // Validate dateKey format (YYYY-MM-DD)
    const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateKeyRegex.test(dateKey)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'date parameter must be in YYYY-MM-DD format' }),
      };
    }

    // Get site-wide store (persists across deploys)
    // Using site-wide store (not deploy-scoped) for persistence
    // Netlify automatically provides siteID and token in Functions environment
    const store = getStore({ name: 'ycdle-solves' });
    const blobKey = `solves:${dateKey}`;

    // Get current count
    let solves = 0;
    try {
      const existing = await store.get(blobKey, { type: 'text' });
      if (existing) {
        solves = parseInt(existing, 10);
        if (isNaN(solves)) {
          solves = 0;
        }
      }
    } catch (error) {
      console.error('Error reading from store:', error);
      // Return 0 if read fails
    }

    // Return response
    const response: StatsResponse = {
      dateKey,
      solves,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in ycdle-stats function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

