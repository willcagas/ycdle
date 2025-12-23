import type { Company, TileResult, GameState } from './types'
import { normalizeForComparison, filterRemoteRegions, parseBatchIndexFromString } from '../utils/normalization'

/**
 * Maximum number of guesses allowed (Wordle-style)
 */
export const MAX_GUESSES = 6

/**
 * Compare batch between guess and target
 */
export function compareBatch(guess: Company, target: Company): TileResult {
  // Exact match
  if (guess.batch === target.batch) {
    return { match: 'exact', color: 'green' }
  }

  // Always parse batchIndex from batch string for consistent comparison
  // This ensures we use the same numbering system regardless of what's in the JSON
  // Only fall back to JSON batchIndex if batch string parsing fails
  const guessIndex = guess.batch ? parseBatchIndexFromString(guess.batch) : guess.batchIndex;
  const targetIndex = target.batch ? parseBatchIndexFromString(target.batch) : target.batchIndex;

  // Compare batchIndex if available
  if (guessIndex !== null && targetIndex !== null) {
    if (guessIndex < targetIndex) {
      return { match: 'up', color: 'red', arrow: 'up' }
    }
    if (guessIndex > targetIndex) {
      return { match: 'down', color: 'red', arrow: 'down' }
    }
  }

  // Unknown/invalid batchIndex
  return { match: 'unknown', color: 'red' }
}

/**
 * Compare industry between guess and target
 */
export function compareIndustry(guess: Company, target: Company): TileResult {
  const guessIndustry = normalizeForComparison(guess.primaryIndustry)
  const targetIndustry = normalizeForComparison(target.primaryIndustry)

  // Exact match
  if (guessIndustry === targetIndustry) {
    return { match: 'exact', color: 'green' }
  }

  // Check if guess.primaryIndustry appears in target.industries
  const targetIndustries = target.industries.map(normalizeForComparison)
  if (targetIndustries.includes(guessIndustry)) {
    return { match: 'partial', color: 'yellow' }
  }

  return { match: 'none', color: 'red' }
}

/**
 * Compare status between guess and target
 */
export function compareStatus(guess: Company, target: Company): TileResult {
  const guessStatus = normalizeForComparison(guess.status)
  const targetStatus = normalizeForComparison(target.status)

  if (guessStatus === targetStatus) {
    return { match: 'exact', color: 'green' }
  }

  return { match: 'none', color: 'red' }
}

/**
 * Compare badges between guess and target
 */
export function compareBadges(guess: Company, target: Company): TileResult {
  const guessBadges = guess.badges.map(normalizeForComparison)
  const targetBadges = target.badges.map(normalizeForComparison)

  // If both are empty, they match (green)
  if (guessBadges.length === 0 && targetBadges.length === 0) {
    return { match: 'exact', color: 'green' }
  }

  // Check for exact match (same elements, order doesn't matter)
  const isExactMatch =
    guessBadges.length === targetBadges.length &&
    guessBadges.every((badge) => targetBadges.includes(badge)) &&
    targetBadges.every((badge) => guessBadges.includes(badge))

  if (isExactMatch) {
    return { match: 'exact', color: 'green' }
  }

  // Check for partial overlap (some elements match but not all)
  const hasOverlap = guessBadges.some((badge) => targetBadges.includes(badge))

  if (hasOverlap) {
    return { match: 'partial', color: 'yellow' }
  }

  return { match: 'none', color: 'red' }
}

/**
 * Compare regions between guess and target
 */
export function compareRegions(guess: Company, target: Company): TileResult {
  // Filter out "remote" and "partially remote" before comparison
  const filteredGuessRegions = filterRemoteRegions(guess.regions)
  const filteredTargetRegions = filterRemoteRegions(target.regions)
  
  const guessRegions = filteredGuessRegions.map(normalizeForComparison)
  const targetRegions = filteredTargetRegions.map(normalizeForComparison)

  // If both are empty, they match (green)
  if (guessRegions.length === 0 && targetRegions.length === 0) {
    return { match: 'exact', color: 'green' }
  }

  // Check for exact match (same elements, order doesn't matter)
  const isExactMatch =
    guessRegions.length === targetRegions.length &&
    guessRegions.every((region) => targetRegions.includes(region)) &&
    targetRegions.every((region) => guessRegions.includes(region))

  if (isExactMatch) {
    return { match: 'exact', color: 'green' }
  }

  // Check for partial overlap (some elements match but not all)
  const hasOverlap = guessRegions.some((region) => targetRegions.includes(region))

  if (hasOverlap) {
    return { match: 'partial', color: 'yellow' }
  }

  return { match: 'none', color: 'red' }
}

/**
 * Get all tile results for a guess compared to target
 */
export function getTileResults(guess: Company, target: Company): TileResult[] {
  return [
    {
      match: 'none',
      color: 'none'
    },
    compareBatch(guess, target),
    compareIndustry(guess, target),
    compareStatus(guess, target),
    compareBadges(guess, target),
    compareRegions(guess, target),
  ]
}

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
 * Initialize a new game with a target company by yc_id
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
  
  const target = byId.get(targetYcId)
  
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
  guessSlug: string,
  _companies: Company[],
  _bySlug: Map<string, Company>
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

