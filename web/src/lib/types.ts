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

export interface GameState {
  targetYcId: number | null;
  targetSlug: string | null; // Kept for backward compatibility and convenience
  guesses: string[];
  gameStatus: 'in-progress' | 'won' | 'lost';
  startedAt: string;
  datasetVersion: string;
}

export interface TileResult {
  match: 'exact' | 'partial' | 'overlap' | 'none' | 'up' | 'down' | 'unknown';
  color: 'green' | 'yellow' | 'red' | 'none';
  arrow?: 'up' | 'down';
}

