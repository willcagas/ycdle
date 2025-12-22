import type { GameState } from './types'

const STORAGE_KEY = 'yc-guesser-state'

/**
 * Save game state to localStorage
 */
export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save game state:', error)
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(): GameState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const state = JSON.parse(stored) as GameState

    // Validate state structure
    if (
      typeof state === 'object' &&
      state !== null &&
      'targetSlug' in state &&
      'guesses' in state &&
      'gameStatus' in state &&
      'startedAt' in state &&
      'datasetVersion' in state
    ) {
      return state
    }

    return null
  } catch (error) {
    console.error('Failed to load game state:', error)
    return null
  }
}

/**
 * Clear game state from localStorage
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear game state:', error)
  }
}

