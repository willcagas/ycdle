/**
 * Game mode detection and management
 * 
 * Supports toggling between:
 * - "daily": Uses Netlify function to get deterministic daily company (production mode)
 * - "unlimited": Uses random company selection (unlimited play mode)
 * 
 * Mode can be set via:
 * 1. Query parameter: ?mode=unlimited or ?mode=daily
 * 2. localStorage: yc-game-mode (persists across sessions)
 */

import type { GameMode } from './types'

const STORAGE_KEY = 'yc-game-mode';

/**
 * Get the current game mode
 * Checks query parameter first, then localStorage, defaults to 'unlimited' in dev, 'daily' in production
 */
export function getGameMode(): GameMode {
  const isDev = import.meta.env.DEV;
  
  // Check query parameter first (takes precedence)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const queryMode = params.get('mode');
    if (queryMode === 'unlimited' || queryMode === 'daily') {
      // Save to localStorage for persistence
      localStorage.setItem(STORAGE_KEY, queryMode);
      return queryMode;
    }

    // In dev mode, ignore localStorage and default to unlimited
    // (This prevents stale 'daily' preference from persisting in dev)
    if (isDev) {
      return 'unlimited';
    }

    // In production, check localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'unlimited' || stored === 'daily') {
      return stored as GameMode;
    }
  }

  // Default: unlimited in dev, daily in production
  return isDev ? 'unlimited' : 'daily';
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
 * Check if we're in daily mode
 */
export function isDailyMode(): boolean {
  return getGameMode() === 'daily';
}

/**
 * Check if we're in unlimited mode
 */
export function isUnlimitedMode(): boolean {
  return getGameMode() === 'unlimited';
}

