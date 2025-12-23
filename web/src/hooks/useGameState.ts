import { useState, useEffect, useCallback } from 'react'
import type { GameState, Company } from '../lib/types'
import { initializeGame, initializeGameRandom, makeGuess as makeGuessEngine } from '../lib/gameEngine'
import { saveGameState, loadGameState } from '../lib/storage'
import { fetchDailyCompanyId } from '../lib/dailyApi'
import { getGameMode, isRandomMode } from '../lib/gameMode'

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
  const [gameMode, setGameMode] = useState<'daily' | 'random'>(getGameMode())

  // Check game mode on mount
  useEffect(() => {
    const currentMode = getGameMode()
    setGameMode(currentMode)
  }, [])

  // Fetch daily company ID (only in daily mode)
  useEffect(() => {
    if (isRandomMode()) {
      setLoadingDaily(false)
      return
    }

    fetchDailyCompanyId()
      .then((id) => {
        setDailyYcId(id) // Will be null if function unavailable
        setLoadingDaily(false)
      })
      .catch(() => {
        setDailyYcId(null)
        setLoadingDaily(false)
      })
  }, [gameMode])

  // Initialize game
  useEffect(() => {
    if (companies.length === 0) return

    // In daily mode, wait for fetch to complete
    if (!isRandomMode() && loadingDaily) return

    const saved = loadGameState()
    
    // If daily mode but function unavailable, fall back to random
    const useRandom = isRandomMode() || (gameMode === 'daily' && dailyYcId === null)
    
    if (useRandom) {
      // Random mode
      if (saved && saved.datasetVersion === datasetVersion) {
        setGameState(saved)
      } else {
        try {
          const newState = initializeGameRandom(companies, datasetVersion)
          setGameState(newState)
          saveGameState(newState)
        } catch (error) {
          console.error('Failed to initialize game:', error)
        }
      }
    } else {
      // Daily mode with valid ID
      const currentDayNumber = getUTCDayNumber()
      const savedDayNumber = saved?.startedAt 
        ? Math.floor(new Date(saved.startedAt).getTime() / (1000 * 60 * 60 * 24))
        : null
      
      if (
        saved && 
        saved.datasetVersion === datasetVersion &&
        saved.targetYcId === dailyYcId &&
        savedDayNumber === currentDayNumber
      ) {
        setGameState(saved)
      } else {
        try {
          const newState = initializeGame(companies, datasetVersion, byId, dailyYcId!)
          setGameState(newState)
          saveGameState(newState)
        } catch (error) {
          console.error('Failed to initialize game:', error)
        }
      }
    }
  }, [companies, datasetVersion, byId, dailyYcId, loadingDaily, gameMode])

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

  // Start a new game
  const startNewGame = useCallback(async () => {
    if (companies.length === 0) {
      console.error('Cannot start new game: companies array is empty')
      return
    }
    
    if (isRandomMode()) {
      // Random mode
      try {
        const newState = initializeGameRandom(companies, datasetVersion)
        setGameState(newState)
        saveGameState(newState)
      } catch (error) {
        console.error('Failed to start new game:', error)
      }
    } else {
      // Daily mode
      const ycId = await fetchDailyCompanyId()
      if (ycId === null) {
        // Fallback to random if function unavailable
        const newState = initializeGameRandom(companies, datasetVersion)
        setGameState(newState)
        saveGameState(newState)
      } else {
        try {
          const newState = initializeGame(companies, datasetVersion, byId, ycId)
          setGameState(newState)
          saveGameState(newState)
        } catch (error) {
          console.error('Failed to start new game:', error)
        }
      }
    }
  }, [companies, datasetVersion, byId, gameMode])

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

