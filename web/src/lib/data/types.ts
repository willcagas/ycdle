/**
 * Data type definitions for companies
 */

export interface Company {
  id: number | string;
  slug: string;
  name: string;
  smallLogoUrl: string;
  oneLiner: string;
  batch: string;
  batchIndex: number | null; // Parsed from string
  status: string;
  primaryIndustry: string;
  industries: string[];
  badges: string[];
  regions: string[];
}

export interface CompaniesData {
  version: string;
  count: number;
  companies: Company[];
}

/**
 * Raw company data from JSON (before normalization)
 */
export interface RawCompany {
  id: number | string;
  slug?: string;
  name: string;
  smallLogoUrl?: string;
  oneLiner?: string;
  batch?: string;
  batchIndex?: string | number | null;
  status?: string;
  primaryIndustry?: string;
  industries?: string | string[] | null;
  badges?: string | string[] | null;
  regions?: string | string[] | null;
}

/**
 * Raw companies data from JSON (before normalization)
 */
export interface RawCompaniesData {
  version?: string;
  companies: RawCompany[];
}

