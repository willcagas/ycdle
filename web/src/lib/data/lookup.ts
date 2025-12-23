/**
 * Lookup map builders for fast company access
 */

import type { Company } from './types'

/**
 * Build lookup maps for fast company access by slug and ID
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
      byId.set(company.id, company);
    }
  }

  return { bySlug, byId };
}

