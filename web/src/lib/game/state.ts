import type { GameState } from '../types'
import type { Company } from '../data'
import { MAX_GUESSES } from './constants'

/**
 * Check if guess matches target exactly
 */
export function checkWin(guessSlug: string, targetSlug: string): boolean {
  return guessSlug === targetSlug
}

/**
 * Check if game is lost (max guesses reached without winning)
 */
export function checkLoss(guesses: string[]): boolean {
  return guesses.length >= MAX_GUESSES
}

/**
 * Initialize a new game with a random target (unlimited mode)
 */
export function initializeGameRandom(
  companies: Company[],
  datasetVersion: string
): GameState {
  if (companies.length === 0) {
    throw new Error('Cannot initialize game: companies array is empty')
  }
  const randomIndex = Math.floor(Math.random() * companies.length)
  const target = companies[randomIndex]

  if (!target) {
    throw new Error('Cannot initialize game: failed to select target company')
  }

  return {
    targetYcId: typeof target.id === 'number' ? target.id : null,
    targetSlug: target.slug,
    guesses: [],
    gameStatus: 'in-progress',
    startedAt: new Date().toISOString(),
    datasetVersion,
  }
}

/**
 * Initialize a new game with a target company by yc_id (daily mode)
 */
export function initializeGame(
  companies: Company[],
  datasetVersion: string,
  byId: Map<string | number, Company>,
  targetYcId: number
): GameState {
  if (companies.length === 0) {
    throw new Error('Cannot initialize game: companies array is empty')
  }
  
  // Try lookup with number first, then string as fallback (handles type mismatches)
  let target = byId.get(targetYcId);
  if (!target) {
    target = byId.get(String(targetYcId));
  }
  
  if (!target) {
    throw new Error(`Cannot initialize game: company with id ${targetYcId} not found`)
  }

  return {
    targetYcId: targetYcId,
    targetSlug: target.slug,
    guesses: [],
    gameStatus: 'in-progress',
    startedAt: new Date().toISOString(),
    datasetVersion,
  }
}

/**
 * Make a guess and update game state
 */
export function makeGuess(
  state: GameState,
  guessSlug: string
): GameState {
  // Don't allow guesses if game is already won/lost
  if (state.gameStatus !== 'in-progress') {
    return state
  }

  // Don't allow duplicate guesses
  if (state.guesses.includes(guessSlug)) {
    return state
  }

  // Add guess
  const newGuesses = [...state.guesses, guessSlug]

  // Check win condition
  if (checkWin(guessSlug, state.targetSlug!)) {
    return {
      ...state,
      guesses: newGuesses,
      gameStatus: 'won',
    }
  }

  // Check loss condition
  if (checkLoss(newGuesses)) {
    return {
      ...state,
      guesses: newGuesses,
      gameStatus: 'lost',
    }
  }

  // Continue game
  return {
    ...state,
    guesses: newGuesses,
  }
}

