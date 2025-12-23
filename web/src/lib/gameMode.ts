/**
 * Game mode utilities for development
 * 
 * Supports toggling between:
 * - "daily": Uses Netlify function to get deterministic daily company (production mode)
 * - "random": Uses random company selection (development mode)
 * 
 * Mode can be set via:
 * 1. Query parameter: ?mode=random or ?mode=daily
 * 2. localStorage: yc-game-mode (persists across sessions)
 */

export type GameMode = 'daily' | 'random';

const STORAGE_KEY = 'yc-game-mode';

/**
 * Get the current game mode
 * Checks query parameter first, then localStorage, defaults to 'random' in dev, 'daily' in production
 */
export function getGameMode(): GameMode {
  const isDev = import.meta.env.DEV;
  
  // Check query parameter first (takes precedence)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const queryMode = params.get('mode');
    if (queryMode === 'random' || queryMode === 'daily') {
      // Save to localStorage for persistence
      localStorage.setItem(STORAGE_KEY, queryMode);
      return queryMode;
    }

    // In dev mode, ignore localStorage and default to random
    // (This prevents stale 'daily' preference from persisting in dev)
    if (isDev) {
      return 'random';
    }

    // In production, check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'random' || stored === 'daily') {
      return stored as GameMode;
    }
  }

  // Default: random in dev, daily in production
  return isDev ? 'random' : 'daily';
}

/**
 * Set the game mode
 */
export function setGameMode(mode: GameMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode);
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', url);
  }
}

/**
 * Check if we're in random mode
 */
export function isRandomMode(): boolean {
  return getGameMode() === 'random';
}

/**
 * Check if we're in daily mode
 */
export function isDailyMode(): boolean {
  return getGameMode() === 'daily';
}

