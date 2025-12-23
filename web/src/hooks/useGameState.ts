import { useState, useEffect, useCallback } from 'react'
import type { GameState, Company } from '../lib/types'
import { initializeGame, makeGuess as makeGuessEngine } from '../lib/gameEngine'
import { saveGameState, loadGameState } from '../lib/storage'
import { fetchDailyCompanyId } from '../lib/dailyApi'

interface UseGameStateOptions {
  companies: Company[];
  bySlug: Map<string, Company>;
  byId: Map<string | number, Company>;
  datasetVersion: string;
}

/**
 * Get UTC day number (days since epoch) - matches server-side logic
 */
function getUTCDayNumber(): number {
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
  return Math.floor(utcDate.getTime() / (1000 * 60 * 60 * 24));
}

export function useGameState({ companies, bySlug, byId, datasetVersion }: UseGameStateOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loadingDaily, setLoadingDaily] = useState(true)
  const [dailyYcId, setDailyYcId] = useState<number | null>(null)

  // Fetch daily company ID
  useEffect(() => {
    fetchDailyCompanyId()
      .then((id) => {
        setDailyYcId(id)
        setLoadingDaily(false)
      })
      .catch((error) => {
        console.error('Failed to fetch daily company ID:', error)
        setLoadingDaily(false)
        // Fallback: we'll handle this in the game initialization
      })
  }, [])

  // Initialize game once we have companies and daily ID
  useEffect(() => {
    // Don't initialize if companies array is empty or we're still loading
    if (companies.length === 0 || loadingDaily || dailyYcId === null) {
      return
    }

    const saved = loadGameState()
    const currentDayNumber = getUTCDayNumber()
    const savedDayNumber = saved?.startedAt 
      ? Math.floor(new Date(saved.startedAt).getTime() / (1000 * 60 * 60 * 24))
      : null
    
    // Check if saved game is for today's company and same dataset version
    if (
      saved && 
      saved.datasetVersion === datasetVersion &&
      saved.targetYcId === dailyYcId &&
      savedDayNumber === currentDayNumber
    ) {
      // Restore saved game for today
      setGameState(saved)
    } else {
      // Start new game with today's company
      try {
        const newState = initializeGame(companies, datasetVersion, byId, dailyYcId)
        setGameState(newState)
        saveGameState(newState)
      } catch (error) {
        console.error('Failed to initialize game:', error)
      }
    }
  }, [companies, datasetVersion, byId, dailyYcId, loadingDaily])

  // Make a guess
  const makeGuess = useCallback(
    (guessSlug: string) => {
      if (!gameState) return

      const newState = makeGuessEngine(gameState, guessSlug, companies, bySlug)
      setGameState(newState)
      saveGameState(newState)
    },
    [gameState, companies, bySlug]
  )

  // Start a new game (re-fetch daily ID to ensure we have today's company)
  const startNewGame = useCallback(async () => {
    if (companies.length === 0) {
      console.error('Cannot start new game: companies array is empty')
      return
    }
    try {
      const ycId = await fetchDailyCompanyId()
      const newState = initializeGame(companies, datasetVersion, byId, ycId)
      setGameState(newState)
      saveGameState(newState)
    } catch (error) {
      console.error('Failed to start new game:', error)
      // Fallback to using current dailyYcId if available
      if (dailyYcId !== null) {
        const newState = initializeGame(companies, datasetVersion, byId, dailyYcId)
        setGameState(newState)
        saveGameState(newState)
      }
    }
  }, [companies, datasetVersion, byId, dailyYcId])

  // Get target company
  const getTargetCompany = useCallback((): Company | null => {
    if (!gameState) return null
    // Prefer yc_id lookup, fallback to slug for backward compatibility
    if (gameState.targetYcId !== null && gameState.targetYcId !== undefined) {
      return byId.get(gameState.targetYcId) || null
    }
    if (gameState.targetSlug) {
      return bySlug.get(gameState.targetSlug) || null
    }
    return null
  }, [gameState, byId, bySlug])

  // Get guess companies
  const getGuessCompanies = useCallback((): Company[] => {
    if (!gameState) return []
    return gameState.guesses
      .map((slug) => bySlug.get(slug))
      .filter((company): company is Company => company !== undefined)
  }, [gameState, bySlug])

  return {
    gameState,
    makeGuess,
    startNewGame,
    getTargetCompany,
    getGuessCompanies,
    loadingDaily,
  }
}

