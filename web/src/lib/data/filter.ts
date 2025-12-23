/**
 * Company filtering utilities
 * 
 * This logic must match the Netlify function exactly.
 * See: web/netlify/functions/daily/index.js
 */

import { normalizeText, ensureArray } from '../../utils/normalization'
import type { RawCompany } from './types'

/**
 * Check if a company has the "topCompany" badge
 * This matches the exact normalization used in the Netlify function
 */
export function isTopCompany(company: RawCompany): boolean {
  const rawBadges = ensureArray(company.badges);
  // Check if company has "topCompany" in its badges array (case-insensitive)
  // This matches: normalizeText(badge).toLowerCase() === 'topcompany'
  return rawBadges.some((badge: string) => 
    normalizeText(badge).toLowerCase() === 'topcompany'
  );
}

/**
 * Filter companies to only include those with "topCompany" badge
 */
export function filterTopCompanies(companies: RawCompany[]): RawCompany[] {
  return companies.filter(isTopCompany);
}

