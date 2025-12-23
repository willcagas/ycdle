/**
 * Netlify Function: Daily Company Selection
 * 
 * Returns a deterministic daily company selection based on UTC date and a secret seed.
 * Route: /.netlify/functions/daily
 */

const { createHash } = require('crypto');
const { readFileSync } = require('fs');
const { join } = require('path');

/**
 * Get UTC day number (days since epoch)
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
 * Load companies data
 */
function loadCompaniesData() {
  // Try multiple possible paths for the data file
  const possiblePaths = [
    join(process.cwd(), 'data', 'yc_companies.json'), // Repo root (most common)
  ];

  // Add __dirname path if available
  if (typeof __dirname !== 'undefined') {
    possiblePaths.push(join(__dirname, '..', '..', 'data', 'yc_companies.json'));
  }

  // Add Netlify-specific paths
  possiblePaths.push(join('/opt', 'netlify', 'build', 'data', 'yc_companies.json'));

  for (const dataPath of possiblePaths) {
    try {
      const rawData = readFileSync(dataPath, 'utf-8');
      console.log(`Successfully loaded data from: ${dataPath}`);
      return JSON.parse(rawData);
    } catch (error) {
      // Try next path
      continue;
    }
  }

  // If all paths failed, throw error with details
  console.error('Failed to load companies data from any path:', possiblePaths);
  console.error('Current working directory:', process.cwd());
  throw new Error('Failed to load companies data: file not found in any expected location');
}

/**
 * Netlify Function Handler
 */
exports.handler = async function(event, context) {
  try {
    // Get seed from environment variable with safe default
    const seed = process.env.YC_DAILY_SEED || 'yc-battle-v1';
    
    // Compute UTC day number
    const utcDayNumber = getUTCDayNumber();
    
    // Load companies data
    const data = loadCompaniesData();
    
    // Filter to only top companies (same logic as frontend)
    const topCompanies = data.companies.filter((company) => {
      const badges = Array.isArray(company.badges) ? company.badges : [];
      return badges.some((badge) => 
        String(badge).toLowerCase().trim() === 'topcompany'
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
    
    // Return only yc_id
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${secondsUntilMidnight}, s-maxage=${secondsUntilMidnight}`,
        'Expires': nextMidnight.toUTCString(),
      },
      body: JSON.stringify({
        yc_id: selectedCompany.id,
      }),
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

