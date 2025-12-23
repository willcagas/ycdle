import { useState, useEffect, useCallback } from 'react'
import type { GameState } from '../lib/types'
import type { Company } from '../lib/data'
import { initializeGame, initializeGameRandom, makeGuess as makeGuessEngine } from '../lib/game'
import { saveGameState, loadGameState } from '../lib/storage'
import { getGameMode, isUnlimitedMode, fetchDailyCompanyId } from '../lib/modes'
import { getUTCDayNumber } from '../lib/core'
import { MILLISECONDS_PER_DAY } from '../lib/game/constants'

interface UseGameStateOptions {
  companies: Company[];
  bySlug: Map<string, Company>;
  byId: Map<string | number, Company>;
  datasetVersion: string;
}

export function useGameState({ companies, bySlug, byId, datasetVersion }: UseGameStateOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const initialMode = getGameMode()
  const [loadingDaily, setLoadingDaily] = useState(() => initialMode === 'daily')
  const [dailyYcId, setDailyYcId] = useState<number | null>(null)
  const [gameMode, setGameMode] = useState<'daily' | 'unlimited'>(() => initialMode)

  // Check game mode on mount
  useEffect(() => {
    const currentMode = getGameMode()
    if (currentMode !== gameMode) {
      queueMicrotask(() => {
    setGameMode(currentMode)
      })
    }
  }, [gameMode])

  // Fetch daily company ID (only in daily mode)
  useEffect(() => {
    const currentMode = getGameMode()
    if (currentMode !== 'daily') {
      // In unlimited mode, loading is already false from initialization
      if (loadingDaily) {
        queueMicrotask(() => {
      setLoadingDaily(false)
        })
      }
      return
    }

    let cancelled = false
    fetchDailyCompanyId()
      .then((id) => {
        if (!cancelled) {
        setDailyYcId(id) // Will be null if function unavailable
        setLoadingDaily(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
        setDailyYcId(null)
        setLoadingDaily(false)
        }
      })
    
    return () => {
      cancelled = true
    }
  }, [gameMode, loadingDaily])

  // Initialize game
  useEffect(() => {
    if (companies.length === 0) return

    // In daily mode, wait for fetch to complete
    if (!isUnlimitedMode() && loadingDaily) return

    const saved = loadGameState()
    
    // If daily mode but function unavailable, fall back to unlimited
    const useRandom = isUnlimitedMode() || (gameMode === 'daily' && dailyYcId === null)
    
    // Use a flag to track if this effect should update state
    let shouldUpdate = true
    
    if (useRandom) {
      // Unlimited mode
      if (saved && saved.datasetVersion === datasetVersion) {
        // Defer state update to avoid synchronous setState in effect
        queueMicrotask(() => {
          if (shouldUpdate) {
        setGameState(saved)
          }
        })
      } else {
        try {
          const newState = initializeGameRandom(companies, datasetVersion)
          queueMicrotask(() => {
            if (shouldUpdate) {
          setGameState(newState)
          saveGameState(newState)
            }
          })
        } catch (error) {
          console.error('Failed to initialize game:', error)
        }
      }
    } else {
      // Daily mode with valid ID
      const currentDayNumber = getUTCDayNumber()
      const savedDayNumber = saved?.startedAt 
        ? Math.floor(new Date(saved.startedAt).getTime() / MILLISECONDS_PER_DAY)
        : null
      
      // Check if saved state matches current daily game
      // Use loose equality (==) to handle potential string/number type mismatches
      const savedMatchesDaily = saved && 
        saved.datasetVersion === datasetVersion &&
        (saved.targetYcId == dailyYcId || saved.targetYcId === dailyYcId) &&
        savedDayNumber === currentDayNumber
      
      if (savedMatchesDaily) {
        queueMicrotask(() => {
          if (shouldUpdate) {
        setGameState(saved)
          }
        })
      } else {
        try {
          const newState = initializeGame(companies, datasetVersion, byId, dailyYcId!)
          
          // ============================================
          // DEBUG LOG 3: Confirm what we ultimately render
          // ============================================
          const finalCompany = newState.targetYcId !== null 
            ? (byId.get(newState.targetYcId) || byId.get(String(newState.targetYcId)))
            : null;
          console.log('[DEBUG] Setting game state with company:', {
            state_targetYcId: newState.targetYcId,
            state_targetSlug: newState.targetSlug,
            resolved_company: finalCompany 
              ? { id: finalCompany.id, name: finalCompany.name }
              : 'NOT FOUND IN byId MAP',
          });
          // ============================================
          
          queueMicrotask(() => {
            if (shouldUpdate) {
          setGameState(newState)
          saveGameState(newState)
            }
          })
        } catch (error) {
          console.error('Failed to initialize game:', error)
          // Don't silently fail - rethrow to surface the error
          throw error
        }
      }
    }
    
    return () => {
      shouldUpdate = false
    }
  }, [companies, datasetVersion, byId, dailyYcId, loadingDaily, gameMode])

  // Make a guess
  const makeGuess = useCallback(
    (guessSlug: string) => {
      if (!gameState) return

      const newState = makeGuessEngine(gameState, guessSlug)
      setGameState(newState)
      saveGameState(newState)
    },
    [gameState]
  )

  // Start a new game
  const startNewGame = useCallback(async () => {
    if (companies.length === 0) {
      console.error('Cannot start new game: companies array is empty')
      return
    }
    
    if (isUnlimitedMode()) {
      // Unlimited mode
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
        // Fallback to unlimited if function unavailable
        const newState = initializeGameRandom(companies, datasetVersion)
        setGameState(newState)
        saveGameState(newState)
      } else {
        try {
          const newState = initializeGame(companies, datasetVersion, byId, ycId)
          
          // ============================================
          // DEBUG LOG 3: Confirm what we ultimately render (startNewGame path)
          // ============================================
          const finalCompany = newState.targetYcId !== null 
            ? (byId.get(newState.targetYcId) || byId.get(String(newState.targetYcId)))
            : null;
          console.log('[DEBUG] startNewGame - Setting game state with company:', {
            state_targetYcId: newState.targetYcId,
            state_targetSlug: newState.targetSlug,
            resolved_company: finalCompany 
              ? { id: finalCompany.id, name: finalCompany.name }
              : 'NOT FOUND IN byId MAP',
          });
          // ============================================
          
          setGameState(newState)
          saveGameState(newState)
        } catch (error) {
          console.error('Failed to start new game:', error)
        }
      }
    }
  }, [companies, datasetVersion, byId])

  // Get target company
  const getTargetCompany = useCallback((): Company | null => {
    if (!gameState) return null
    // Prefer yc_id lookup, fallback to slug for backward compatibility
    if (gameState.targetYcId !== null && gameState.targetYcId !== undefined) {
      // Try lookup with number first, then string as fallback (handles type mismatches)
      const company = byId.get(gameState.targetYcId) || byId.get(String(gameState.targetYcId)) || null
      
      // ============================================
      // DEBUG LOG 3: Confirm what we ultimately render (getTargetCompany)
      // ============================================
      console.log('[DEBUG] getTargetCompany - Resolving company for render:', {
        gameState_targetYcId: gameState.targetYcId,
        gameState_targetSlug: gameState.targetSlug,
        resolved_company: company 
          ? { id: company.id, name: company.name }
          : 'NOT FOUND',
      });
      // ============================================
      
      return company
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

