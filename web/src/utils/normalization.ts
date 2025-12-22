/**
 * Normalize text: strip, collapse whitespace, remove newlines/tabs
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ') // Replace all whitespace with single space
    .replace(/[\n\t\r]/g, '') // Remove newlines, tabs, carriage returns
    .trim();
}

/**
 * Ensure a value is an array, converting empty strings to empty arrays
 */
export function ensureArray<T>(value: T | T[] | null | undefined | string): T[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string' && value === '') return [];
  if (Array.isArray(value)) return value as T[];
  return [value as T];
}

/**
 * Parse batchIndex from string to number
 * Returns null if invalid or missing
 */
export function parseBatchIndex(batchIndex: string | number | null | undefined): number | null {
  if (batchIndex === null || batchIndex === undefined) return null;
  if (typeof batchIndex === 'number') return batchIndex;
  if (typeof batchIndex === 'string') {
    const parsed = parseFloat(batchIndex);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Parse batchIndex from batch string (e.g., "f25", "w26", "s25", "x25")
 * Format: [season letter][year]
 * - w = Winter (0)
 * - x = Spring (1)
 * - s = Summer (2)
 * - f = Fall (3)
 * Returns a comparable index: year * 4 + season_offset
 */
export function parseBatchIndexFromString(batch: string | null | undefined): number | null {
  if (!batch) return null;
  
  const normalized = batch.trim().toLowerCase();
  // Match pattern: single letter followed by digits (e.g., "f25", "w26", "s25", "x25")
  const match = normalized.match(/^([wxfs])(\d+)$/);
  if (!match) return null;
  
  const season = match[1];
  const year = parseInt(match[2], 10);
  if (isNaN(year)) return null;
  
  // Map seasons to offsets for chronological ordering
  // Within a year: Winter (0), Spring (1), Summer (2), Fall (3)
  // Multiply year by 4 to leave room for ordering
  const seasonOffsets: Record<string, number> = {
    'w': 0, // Winter
    'x': 1, // Spring
    's': 2, // Summer
    'f': 3, // Fall
  };
  
  const offset = seasonOffsets[season];
  if (offset === undefined) return null;
  
  // Return year * 4 + season_offset for comparable ordering
  return year * 4 + offset;
}

/**
 * Normalize string for case-insensitive comparison
 */
export function normalizeForComparison(text: string): string {
  return normalizeText(text).toLowerCase();
}

/**
 * Convert camelCase to Title Case (e.g., "topCompany" -> "Top Company")
 */
export function camelCaseToTitleCase(text: string): string {
  if (!text) return '';
  // Insert space before capital letters and trim
  const spaced = text.replace(/([A-Z])/g, ' $1').trim();
  // Capitalize first letter and the rest of each word
  return spaced
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize badge name for display
 * Converts "highlightX" to "X-founded" (e.g., "highlightWomen" -> "Women-founded")
 */
export function normalizeBadgeForDisplay(badge: string): string {
  if (!badge) return '';
  
  // Check if badge starts with "highlight" (case-insensitive)
  const normalized = badge.toLowerCase();
  if (normalized.startsWith('highlight')) {
    // Extract the part after "highlight" and capitalize it
    const suffix = badge.substring('highlight'.length);
    if (suffix) {
      // Capitalize first letter
      const capitalized = suffix.charAt(0).toUpperCase() + suffix.slice(1);
      return `${capitalized}-founded`;
    }
  }
  
  // For other badges, use camelCaseToTitleCase
  return camelCaseToTitleCase(badge);
}

/**
 * Filter out "remote", "partly remote", "partially remote", and "fully remote" from region array (case-insensitive)
 */
export function filterRemoteRegions(regions: string[]): string[] {
  const remotePatterns = ['remote', 'partly remote', 'partially remote', 'fully remote'];
  return regions.filter(region => {
    const normalized = normalizeForComparison(region);
    return !remotePatterns.includes(normalized);
  });
}

/**
 * Normalize region name for display (e.g., "United States Of America" -> "US")
 */
export function normalizeRegionForDisplay(region: string): string {
  const normalized = normalizeForComparison(region);
  
  // Handle "United States Of America", "United States of America", "USA", or "America"
  if (normalized.includes('united states') || normalized === 'usa' || normalized === 'america') {
    return 'US';
  }
  
  // Handle "America / Canada" - split and normalize each part
  if (region.includes(' / ')) {
    const parts = region.split(' / ').map(part => normalizeRegionForDisplay(part.trim()));
    // Remove duplicates and join
    const uniqueParts = Array.from(new Set(parts));
    return uniqueParts.join(', ');
  }
  
  // Return the original region name if no normalization needed
  return region;
}

