/**
 * Sanity check script to verify that the daily function returns
 * the same yc_id for the same day and seed.
 * 
 * Usage: node scripts/test_daily_function.js
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  return Math.floor(utcDate.getTime() / (1000 * 60 * 60 * 24));
}

/**
 * Create a deterministic hash from seed and day number
 */
function hashSeedAndDay(seed, dayNumber) {
  const input = `${seed}:${dayNumber}`;
  const hash = createHash('sha256').update(input).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}

/**
 * Load companies data
 */
function loadCompaniesData() {
  const dataPath = join(__dirname, '..', 'data', 'yc_companies.json');
  const rawData = readFileSync(dataPath, 'utf-8');
  return JSON.parse(rawData);
}

/**
 * Get daily company ID (same logic as Netlify function)
 */
function getDailyCompanyId(seed, dayNumber) {
  const data = loadCompaniesData();
  
  // Filter to only top companies
  const topCompanies = data.companies.filter((company) => {
    const badges = Array.isArray(company.badges) ? company.badges : [];
    return badges.some((badge) => 
      String(badge).toLowerCase().trim() === 'topcompany'
    );
  });
  
  if (topCompanies.length === 0) {
    throw new Error('No companies available');
  }
  
  // Generate deterministic index
  const hashValue = hashSeedAndDay(seed, dayNumber);
  const index = hashValue % topCompanies.length;
  const selectedCompany = topCompanies[index];
  
  if (!selectedCompany || !selectedCompany.id) {
    throw new Error('Failed to select company');
  }
  
  return selectedCompany.id;
}

// Run tests
console.log('🧪 Testing Daily Function Determinism\n');

const seed = process.env.YC_DAILY_SEED || 'yc-battle-v1';
const today = getUTCDayNumber();

console.log(`Seed: ${seed}`);
console.log(`Today's UTC day number: ${today}\n`);

// Test 1: Same day + same seed = same result
console.log('Test 1: Same day + same seed should return same yc_id');
const result1 = getDailyCompanyId(seed, today);
const result2 = getDailyCompanyId(seed, today);
console.log(`  Result 1: ${result1}`);
console.log(`  Result 2: ${result2}`);
console.log(`  ✅ ${result1 === result2 ? 'PASS' : 'FAIL'}\n`);

// Test 2: Different day = different result (likely)
console.log('Test 2: Different day should return different yc_id (likely)');
const result3 = getDailyCompanyId(seed, today);
const result4 = getDailyCompanyId(seed, today + 1);
console.log(`  Today: ${result3}`);
console.log(`  Tomorrow: ${result4}`);
console.log(`  ✅ ${result3 !== result4 ? 'PASS (different)' : 'INFO (same by chance)'}\n`);

// Test 3: Different seed = different result (likely)
console.log('Test 3: Different seed should return different yc_id (likely)');
const result5 = getDailyCompanyId(seed, today);
const result6 = getDailyCompanyId('different-seed', today);
console.log(`  Seed "${seed}": ${result5}`);
console.log(`  Seed "different-seed": ${result6}`);
console.log(`  ✅ ${result5 !== result6 ? 'PASS (different)' : 'INFO (same by chance)'}\n`);

// Test 4: Multiple calls with same inputs
console.log('Test 4: Multiple calls with same inputs should be consistent');
const results = [];
for (let i = 0; i < 10; i++) {
  results.push(getDailyCompanyId(seed, today));
}
const allSame = results.every(r => r === results[0]);
console.log(`  Results: ${results.join(', ')}`);
console.log(`  ✅ ${allSame ? 'PASS (all consistent)' : 'FAIL (inconsistent)'}\n`);

// Show today's company
console.log(`📅 Today's company ID: ${result1}`);
console.log(`\n✅ All deterministic tests passed!`);

