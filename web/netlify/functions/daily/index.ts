/**
 * Netlify Function: Daily Company Selection
 * 
 * Returns a deterministic daily company selection based on UTC date and a secret seed.
 * Route: /.netlify/functions/daily
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Company {
  id: number;
  badges?: string | string[];
  [key: string]: unknown;
}

interface CompaniesData {
  companies: Company[];
  [key: string]: unknown;
}

interface DailyResponse {
  yc_id: number;
  debug?: {
    seed: string;
    utc_day_number: number;
    computed_index: number;
    selected_yc_id: number;
    seconds_until_midnight: number;
    day_offset_applied: number | null;
  };
}

/**
 * Get UTC day number (days since epoch)
 * 
 * IMPORTANT: This logic MUST match web/src/lib/core/date.ts exactly.
 * Any changes to this function must be reflected in the frontend code.
 */
function getUTCDayNumber(): number {
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
  // Days since epoch (Jan 1, 1970)
  return Math.floor(utcDate.getTime() / (1000 * 60 * 60 * 24));
}

/**
 * Create a deterministic hash from seed and day number
 */
function hashSeedAndDay(seed: string, dayNumber: number): number {
  const input = `${seed}:${dayNumber}`;
  const hash = createHash('sha256').update(input).digest('hex');
  // Convert first 8 hex characters to a number for consistent indexing
  return parseInt(hash.substring(0, 8), 16);
}

/**
 * Normalize text: strip, collapse whitespace, remove newlines/tabs
 * This matches the frontend's normalizeText function exactly
 */
function normalizeText(text: unknown): string {
  if (!text) return '';
  return String(text)
    .replace(/\s+/g, ' ') // Replace all whitespace with single space
    .replace(/[\n\t\r]/g, '') // Remove newlines, tabs, carriage returns
    .trim();
}

/**
 * Ensure a value is an array
 * This matches the frontend's ensureArray function
 */
function ensureArray(value: unknown): unknown[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' && value === '') return [];
  if (Array.isArray(value)) return value;
  return [value];
}

/**
 * Load companies data
 */
function loadCompaniesData(): CompaniesData {
  try {
    // Try to load from data directory (relative to function location)
    // In Netlify, functions run from the repo root
    const dataPath = join(process.cwd(), 'data', 'yc_companies.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    return JSON.parse(rawData) as CompaniesData;
  } catch (error) {
    console.error('Failed to load companies data:', error);
    throw new Error('Failed to load companies data');
  }
}

/**
 * Netlify Function Handler
 */
export async function handler(event: {
  httpMethod: string;
  queryStringParameters?: { debug?: string; day_offset?: string };
}): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> {
  try {
    // Get seed from environment variable with safe default
    const seed = process.env.YC_DAILY_SEED || 'ycdle-v1';

    // If seed is not set, return an error
    if (!seed) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'YC_DAILY_SEED environment variable is required' }),
      };
    }
    
    // Compute UTC day number
    let utcDayNumber = getUTCDayNumber();
    
    // Check if debug mode is enabled
    const isDebugMode = event.queryStringParameters?.debug === '1';
    
    // TEMPORARY: Allow day_offset in debug mode only (for testing UTC midnight flip)
    // This simulates different days without waiting for actual UTC midnight
    if (isDebugMode && event.queryStringParameters?.day_offset !== undefined) {
      const dayOffset = parseInt(event.queryStringParameters.day_offset, 10);
      if (!isNaN(dayOffset)) {
        utcDayNumber += dayOffset;
      }
    }
    
    // Load companies data
    const data = loadCompaniesData();
    
    // Filter to only top companies (same logic as frontend)
    // Must match the exact normalization used in web/src/lib/dataLoader.ts
    const topCompanies = data.companies.filter((company) => {
      const rawBadges = ensureArray(company.badges);
      // Check if company has "topCompany" in its badges array (case-insensitive)
      // This matches: normalizeText(badge).toLowerCase() === 'topcompany'
      return rawBadges.some((badge) => 
        normalizeText(badge).toLowerCase() === 'topcompany'
      );
    });
    
    if (topCompanies.length === 0) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'No companies available' }),
      };
    }
    
    // Generate deterministic index
    const hashValue = hashSeedAndDay(seed, utcDayNumber);
    const index = hashValue % topCompanies.length;
    const selectedCompany = topCompanies[index];
    
    if (!selectedCompany || !selectedCompany.id) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to select company' }),
      };
    }
    
    // Calculate cache expiration (time until next UTC midnight)
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    const secondsUntilMidnight = Math.floor((nextMidnight.getTime() - now.getTime()) / 1000);
    
    // Generate a short hash of the seed for the X-YCDLE-Seed-Hash header (first 8 chars)
    const seedHash = createHash('sha256').update(seed).digest('hex').substring(0, 8);
    
    // Prepare response headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-YCDLE-Day': utcDayNumber.toString(),
      'X-YCDLE-Seed-Hash': seedHash,
    };
    
    // Set cache headers based on debug mode
    if (isDebugMode) {
      // Debug mode: no caching to always show current logic
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    } else {
      // Normal mode: cache until next UTC midnight with stale-while-revalidate
      // Use a short stale-while-revalidate window (e.g., 1 hour) for smooth transitions
      const staleWhileRevalidate = 3600; // 1 hour
      headers['Cache-Control'] = `public, max-age=${secondsUntilMidnight}, s-maxage=${secondsUntilMidnight}, stale-while-revalidate=${staleWhileRevalidate}`;
      headers['Expires'] = nextMidnight.toUTCString();
    }
    
    // Return only yc_id (or debug info if debug mode is enabled)
    const responseBody: DailyResponse = isDebugMode
      ? {
          yc_id: selectedCompany.id,
          debug: {
            seed: seed,
            utc_day_number: utcDayNumber,
            computed_index: index,
            selected_yc_id: selectedCompany.id,
            seconds_until_midnight: secondsUntilMidnight,
            day_offset_applied: event.queryStringParameters?.day_offset !== undefined 
              ? parseInt(event.queryStringParameters.day_offset, 10) 
              : null,
          },
        }
      : {
          yc_id: selectedCompany.id,
        };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseBody),
    };
  } catch (error) {
    console.error('Error in daily function:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}