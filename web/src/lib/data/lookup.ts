/**
 * Lookup map builders for fast company access
 */

import type { Company } from './types'

/**
 * Build lookup maps for fast company access by slug and ID
 * 
 * IMPORTANT: IDs are stored as both number and string keys to handle type mismatches.
 * This ensures lookups work whether the ID comes as a string or number.
 */
export function buildLookupMaps(companies: Company[]): {
  bySlug: Map<string, Company>;
  byId: Map<string | number, Company>;
} {
  const bySlug = new Map<string, Company>();
  const byId = new Map<string | number, Company>();

  for (const company of companies) {
    if (company.slug) {
      bySlug.set(company.slug, company);
    }
    if (company.id !== null && company.id !== undefined) {
      // Store with both number and string keys to handle type mismatches
      // JavaScript Map uses strict equality (===), so 1793 !== "1793"
      byId.set(company.id, company);
      // Also store as the opposite type if it's a number
      if (typeof company.id === 'number') {
        byId.set(String(company.id), company);
      } else if (typeof company.id === 'string' && !isNaN(Number(company.id))) {
        byId.set(Number(company.id), company);
      }
    }
  }

  return { bySlug, byId };
}

