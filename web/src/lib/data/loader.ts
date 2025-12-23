/**
 * Load and normalize company data from JSON file
 */

import type { Company, CompaniesData, RawCompaniesData } from './types'
import { normalizeText, ensureArray, parseBatchIndex } from '../../utils/normalization'
import { filterTopCompanies } from './filter'
import { buildLookupMaps } from './lookup'

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
    const dataModule = await import('../../data/yc_companies.json');
    const data = normalizeCompaniesData(dataModule.default);
    const { bySlug, byId } = buildLookupMaps(data.companies);
    return { data, companies: data.companies, bySlug, byId };
  }

  const rawData: RawCompaniesData = await response.json();
  const data = normalizeCompaniesData(rawData);
  const { bySlug, byId } = buildLookupMaps(data.companies);

  return { data, companies: data.companies, bySlug, byId };
}

/**
 * Normalize the entire companies dataset
 */
function normalizeCompaniesData(rawData: RawCompaniesData): CompaniesData {
  // Filter to only include companies with "topCompany" badge (knowledge-based recognition requirement)
  const topCompanies = filterTopCompanies(rawData.companies);
  
  const companies: Company[] = topCompanies.map((company) => ({
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

