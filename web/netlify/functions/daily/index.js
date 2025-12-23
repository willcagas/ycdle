/**
 * Netlify Function: Daily Company Selection
 * 
 * Returns a deterministic daily company selection based on UTC date and a secret seed.
 * Route: /.netlify/functions/daily
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Get UTC day number (days since epoch)
 * 
 * IMPORTANT: This logic MUST match web/src/lib/core/date.ts exactly.
 * Any changes to this function must be reflected in the frontend code.
 */
function getUTCDayNumber() {
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
function hashSeedAndDay(seed, dayNumber) {
  const input = `${seed}:${dayNumber}`;
  const hash = createHash('sha256').update(input).digest('hex');
  // Convert first 8 hex characters to a number for consistent indexing
  return parseInt(hash.substring(0, 8), 16);
}

/**
 * Normalize text: strip, collapse whitespace, remove newlines/tabs
 * This matches the frontend's normalizeText function exactly
 */
function normalizeText(text) {
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
function ensureArray(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' && value === '') return [];
  if (Array.isArray(value)) return value;
  return [value];
}

/**
 * Load companies data
 */
function loadCompaniesData() {
  try {
    // Try to load from data directory (relative to function location)
    // In Netlify, functions run from the repo root
    const dataPath = join(process.cwd(), 'data', 'yc_companies.json');
    const rawData = readFileSync(dataPath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Failed to load companies data:', error);
    throw new Error('Failed to load companies data');
  }
}

/**
 * Netlify Function Handler
 */
export async function handler(event, context) {
  try {
    // Get seed from environment variable with safe default
    const seed = process.env.YC_DAILY_SEED;

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
    const utcDayNumber = getUTCDayNumber();
    
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
    
    // ============================================
    // SINGLE SOURCE OF TRUTH: Compute selection exactly once
    // ============================================
    // Generate deterministic hash from seed and day number
    const hashValue = hashSeedAndDay(seed, utcDayNumber);
    
    // Compute index into the filtered topCompanies array
    // IMPORTANT: This index is ONLY valid for the topCompanies array
    const computedIndex = hashValue % topCompanies.length;
    
    // Select company from the filtered topCompanies array using computedIndex
    // This is the ONLY place where selection happens
    const selectedCompany = topCompanies[computedIndex];
    
    if (!selectedCompany || !selectedCompany.id) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Failed to select company' }),
      };
    }
    
    // Extract yc_id from the selected company (single source of truth)
    const selectedYcId = selectedCompany.id;
    
    // ============================================
    // DEBUG LOGGING - REMOVE WHEN FIXED
    // ============================================
    console.log('[DAILY FUNCTION DEBUG]', {
      seed,
      utcDayNumber,
      topCompaniesLength: topCompanies.length,
      computedIndex,
      selectedCompany: {
        id: selectedCompany.id,
        name: selectedCompany.name,
        idType: typeof selectedCompany.id,
      },
      selectedYcId,
      selectedYcIdType: typeof selectedYcId,
    });
    // ============================================
    
    // ============================================
    // TEMPORARY DEBUG MODE - REMOVE WHEN DONE
    // ============================================
    const isDebugMode = event.queryStringParameters?.debug === '1';
    // ============================================
    
    // Calculate cache expiration (time until next UTC midnight)
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));
    const secondsUntilMidnight = Math.floor((nextMidnight.getTime() - now.getTime()) / 1000);
    
    // ============================================
    // CRITICAL: Build response body - both paths MUST use the exact same selectedYcId
    // ============================================
    // Force both paths to use the exact same value - no room for error
    const yc_id = Number(selectedYcId); // Ensure it's a number
    
    // Validate that selectedCompany.id matches what we're returning
    if (selectedCompany.id !== yc_id && Number(selectedCompany.id) !== yc_id) {
      console.error('[DAILY FUNCTION ERROR] ID mismatch!', {
        selectedCompany_id: selectedCompany.id,
        selectedCompany_idType: typeof selectedCompany.id,
        yc_id,
        yc_idType: typeof yc_id,
      });
    }
    
    // Build base response with yc_id - this is the SINGLE SOURCE OF TRUTH
    const baseResponse = {
      yc_id: yc_id,
    };
    
    // Add debug fields if needed, but yc_id comes from baseResponse
    const responseBody = isDebugMode
      ? {
          ...baseResponse, // Spread to ensure we use the exact same yc_id
          debug: {
            seed: seed,
            utc_day_number: utcDayNumber,
            computed_index: computedIndex,
            selected_yc_id: yc_id, // Same as baseResponse.yc_id
          },
        }
      : baseResponse; // Non-debug: use baseResponse directly
    
    // ============================================
    // DEBUG LOGGING - REMOVE WHEN FIXED
    // ============================================
    console.log('[DAILY FUNCTION DEBUG] Response body:', {
      isDebugMode,
      selectedYcId_original: selectedYcId,
      yc_id_final: yc_id,
      responseBody_yc_id: responseBody.yc_id,
      match: responseBody.yc_id === yc_id,
      responseBody: JSON.stringify(responseBody),
    });
    // ============================================
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${secondsUntilMidnight}, s-maxage=${secondsUntilMidnight}`,
        'Expires': nextMidnight.toUTCString(),
      },
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

