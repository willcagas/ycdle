import { useState, useEffect, useCallback } from 'react'
import type { GameState, Company } from '../lib/types'
import { initializeGame, makeGuess as makeGuessEngine } from '../lib/gameEngine'
import { saveGameState, loadGameState } from '../lib/storage'

interface UseGameStateOptions {
  companies: Company[];
  bySlug: Map<string, Company>;
  datasetVersion: string;
}

export function useGameState({ companies, bySlug, datasetVersion }: UseGameStateOptions) {
  const [gameState, setGameState] = useState<GameState | null>(null)

  // Load state on mount
  useEffect(() => {
    // Don't initialize if companies array is empty
    if (companies.length === 0) {
      return
    }

    const saved = loadGameState()
    
    // For MVP: restore regardless of version, or validate version match
    if (saved && saved.datasetVersion === datasetVersion) {
      setGameState(saved)
    } else if (saved) {
      // Version mismatch - start new game
      const newState = initializeGame(companies, datasetVersion)
      setGameState(newState)
      saveGameState(newState)
    } else {
      // No saved state - start new game
      const newState = initializeGame(companies, datasetVersion)
      setGameState(newState)
      saveGameState(newState)
    }
  }, [companies, datasetVersion])

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
  const startNewGame = useCallback(() => {
    if (companies.length === 0) {
      console.error('Cannot start new game: companies array is empty')
      return
    }
    const newState = initializeGame(companies, datasetVersion)
    setGameState(newState)
    saveGameState(newState)
  }, [companies, datasetVersion])

  // Get target company
  const getTargetCompany = useCallback((): Company | null => {
    if (!gameState?.targetSlug) return null
    return bySlug.get(gameState.targetSlug) || null
  }, [gameState, bySlug])

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
  }
}

