/**
 * Netlify Function: Increment Daily Solve Counter
 * 
 * POST /.netlify/functions/ycdle-solve
 * Body: { dateKey: string }
 * 
 * Increments the site-wide solve counter for the given dateKey.
 * Uses Netlify Blobs site-wide store for persistence across deploys.
 */

import { getStore } from '@netlify/blobs';

interface SolveRequest {
  dateKey: string;
}

interface SolveResponse {
  dateKey: string;
  solves: number;
}

/**
 * Netlify Function Handler
 */
export async function handler(event: { httpMethod: string; body?: string }): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    let requestBody: SolveRequest;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // Validate dateKey
    if (!requestBody.dateKey || typeof requestBody.dateKey !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'dateKey is required and must be a string' }),
      };
    }

    // Validate dateKey format (YYYY-MM-DD)
    const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateKeyRegex.test(requestBody.dateKey)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'dateKey must be in YYYY-MM-DD format' }),
      };
    }

    // Get site-wide store (persists across deploys)
    // Using site-wide store (not deploy-scoped) for persistence
    // Netlify automatically provides siteID and token in Functions environment
    const store = getStore({ name: 'ycdle-solves' });
    const blobKey = `solves:${requestBody.dateKey}`;

    // Get current count
    let currentCount = 0;
    try {
      const existing = await store.get(blobKey, { type: 'text' });
      if (existing) {
        currentCount = parseInt(existing, 10);
        if (isNaN(currentCount)) {
          currentCount = 0;
        }
      }
    } catch (error) {
      console.error('Error reading from store:', error);
      // Continue with 0 if read fails
    }

    // Increment count
    const newCount = currentCount + 1;

    // Save to store
    try {
      await store.set(blobKey, newCount.toString());
    } catch (error) {
      console.error('Error writing to store:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to save solve count' }),
      };
    }

    // Return success response
    const response: SolveResponse = {
      dateKey: requestBody.dateKey,
      solves: newCount,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in ycdle-solve function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

