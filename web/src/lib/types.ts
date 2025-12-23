/**
 * Game-related type definitions
 * 
 * For data-related types (Company, CompaniesData), see lib/data/types.ts
 */

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

