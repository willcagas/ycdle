import type { Company, CompaniesData } from './types';
import { normalizeText, ensureArray, parseBatchIndex } from '../utils/normalization';

/**
 * Load and normalize company data from JSON file
 */
export async function loadCompaniesData(): Promise<{
  data: CompaniesData;
  companies: Company[];
  bySlug: Map<string, Company>;
  byId: Map<string | number, Company>;
}> {
  // Try public/data first (for production), fallback to src/data (for development)
  let response: Response;
  try {
    response = await fetch('/data/yc_companies.json');
    if (!response.ok) throw new Error('Failed to fetch from public/data');
  } catch {
    // Fallback to importing from src/data
    const dataModule = await import('../data/yc_companies.json');
    const data = normalizeCompaniesData(dataModule.default);
    const { bySlug, byId } = buildLookupMaps(data.companies);
    return { data, companies: data.companies, bySlug, byId };
  }

  const rawData = await response.json();
  const data = normalizeCompaniesData(rawData);
  const { bySlug, byId } = buildLookupMaps(data.companies);

  return { data, companies: data.companies, bySlug, byId };
}

/**
 * Normalize the entire companies dataset
 */
function normalizeCompaniesData(rawData: any): CompaniesData {
  const companies: Company[] = rawData.companies
    // Filter to only include companies with "topCompany" badge (knowledge-based recognition requirement)
    // Check raw badges before normalization to ensure case-insensitive matching
    .filter((company: any) => {
      const rawBadges = ensureArray(company.badges);
      // Check if company has "topCompany" in its badges array (case-insensitive)
      return rawBadges.some((badge: string) => 
        normalizeText(badge).toLowerCase() === 'topcompany'
      );
    })
    .map((company: any) => ({
      id: company.id,
      slug: company.slug || '',
      name: normalizeText(company.name),
      smallLogoUrl: company.smallLogoUrl || '',
      oneLiner: normalizeText(company.oneLiner),
      batch: company.batch || '',
      batchIndex: parseBatchIndex(company.batchIndex),
      status: normalizeText(company.status),
      primaryIndustry: normalizeText(company.primaryIndustry),
      industries: ensureArray(company.industries).map(normalizeText),
      badges: ensureArray(company.badges).map(normalizeText),
      regions: ensureArray(company.regions).map(normalizeText),
    }));

  return {
    version: rawData.version || '',
    count: companies.length,
    companies,
  };
}

/**
 * Build lookup maps for fast company access
 */
function buildLookupMaps(companies: Company[]): {
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

