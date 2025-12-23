/**
 * Test script to verify daily function logic
 * Run with: node test_daily_function.js
 */

const { createHash } = require('crypto');
const { readFileSync } = require('fs');
const { join } = require('path');

function getUTCDayNumber() {
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
  return Math.floor(utcDate.getTime() / (1000 * 60 * 60 * 24));
}

function hashSeedAndDay(seed, dayNumber) {
  const input = `${seed}:${dayNumber}`;
  const hash = createHash('sha256').update(input).digest('hex');
  return parseInt(hash.substring(0, 8), 16);
}

function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/[\n\t\r]/g, '')
    .trim();
}

function ensureArray(value) {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' && value === '') return [];
  if (Array.isArray(value)) return value;
  return [value];
}

// Test the logic
const seed = 'zzz-demo-reset-999';
const utcDayNumber = getUTCDayNumber();

console.log('Testing daily function logic:');
console.log('Seed:', seed);
console.log('UTC Day Number:', utcDayNumber);

// Load data
const dataPath = join(process.cwd(), 'web', 'public', 'data', 'yc_companies.json');
const rawData = readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

// Filter top companies
const topCompanies = data.companies.filter((company) => {
  const rawBadges = ensureArray(company.badges);
  return rawBadges.some((badge) => 
    normalizeText(badge).toLowerCase() === 'topcompany'
  );
});

console.log('Total companies:', data.companies.length);
console.log('Top companies count:', topCompanies.length);

// Compute selection
const hashValue = hashSeedAndDay(seed, utcDayNumber);
const computedIndex = hashValue % topCompanies.length;
const selectedCompany = topCompanies[computedIndex];

console.log('\nSelection results:');
console.log('Hash value:', hashValue);
console.log('Computed index:', computedIndex);
console.log('Selected company:', {
  id: selectedCompany.id,
  name: selectedCompany.name,
  idType: typeof selectedCompany.id,
});

// Test both response formats
const selectedYcId = selectedCompany.id;

const debugResponse = {
  yc_id: selectedYcId,
  debug: {
    seed: seed,
    utc_day_number: utcDayNumber,
    computed_index: computedIndex,
    selected_yc_id: selectedYcId,
  },
};

const nonDebugResponse = {
  yc_id: selectedYcId,
};

console.log('\nDebug response yc_id:', debugResponse.yc_id);
console.log('Non-debug response yc_id:', nonDebugResponse.yc_id);
console.log('Match:', debugResponse.yc_id === nonDebugResponse.yc_id);

// Check if there's any weirdness with the array
console.log('\nArray checks:');
console.log('topCompanies[12]:', topCompanies[12] ? { id: topCompanies[12].id, name: topCompanies[12].name } : 'undefined');
console.log('topCompanies[computedIndex]:', topCompanies[computedIndex] ? { id: topCompanies[computedIndex].id, name: topCompanies[computedIndex].name } : 'undefined');

