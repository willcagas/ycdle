import { useEffect, useRef, useState } from 'react'
import type { Company } from '../lib/data'
import { getTileResults } from '../lib/game'
import { normalizeBadgeForDisplay, filterRemoteRegions, normalizeRegionForDisplay } from '../utils/normalization'
import Tile from './Tile'

interface GameGridProps {
  guesses: Company[];
  target: Company | null;
}

import { SLIDE_ANIMATION_DURATION_MS } from '../lib/game'

const TILE_LABELS = ['Company', 'Batch', 'Industry', 'Status', 'Badges', 'Regions']

// Render header row with category labels
function renderHeader() {
  return (
    <div className="flex gap-1.5 sm:gap-2 mb-2">
      {TILE_LABELS.map((label, colIndex) => (
        <div
          key={colIndex}
          className="w-14 h-6 sm:w-20 sm:h-8 md:w-24 flex items-center justify-center text-xs sm:text-sm font-semibold text-black flex-shrink-0"
        >
          {label}
        </div>
      ))}
    </div>
  )
}

// Get the display value for each tile based on the company and column index
function getTileValue(company: Company, colIndex: number): string {
  switch (colIndex) {
    case 0: // Company
      return company.name
    case 1: // Batch
      return company.batch || ''
    case 2: // Industry
      return company.primaryIndustry || ''
    case 3: // Status
      return company.status || ''
    case 4: // Badges
      return company.badges.length > 0 
        ? company.badges.map(badge => normalizeBadgeForDisplay(badge)).join(', ') 
        : 'None'
    case 5: { // Regions
      const filteredRegions = filterRemoteRegions(company.regions)
      if (filteredRegions.length === 0) return 'None'
      // Normalize each region and split by comma (for cases like "America / Canada" -> "US, Canada")
      const normalizedParts = filteredRegions
        .flatMap(region => normalizeRegionForDisplay(region).split(', '))
        .map(part => part.trim())
      // Remove duplicates while preserving order
      const uniqueParts = Array.from(new Set(normalizedParts))
      return uniqueParts.join(', ')
    }
    default:
      return ''
  }
}

export default function GameGrid({ guesses, target }: GameGridProps) {
  const prevGuessesLengthRef = useRef(0)
  const [slidingRows, setSlidingRows] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Detect if a new guess was added
    if (guesses.length > prevGuessesLengthRef.current && prevGuessesLengthRef.current > 0) {
      // Mark all existing guesses (except the new one) as sliding
      const existingSlugs = guesses.slice(0, -1).map(g => g.slug)
      // Defer state update to avoid synchronous setState in effect
      queueMicrotask(() => {
      setSlidingRows(new Set(existingSlugs))
      // Reset after animation completes
      setTimeout(() => {
        setSlidingRows(new Set())
      }, SLIDE_ANIMATION_DURATION_MS)
      })
    }
    prevGuessesLengthRef.current = guesses.length
  }, [guesses.length, guesses])

  // Reverse guesses so newest appears at the top
  const reversedGuesses = [...guesses].reverse()

  // If no target or no guesses, show headers only
  if (!target || reversedGuesses.length === 0) {
    return (
      <div className="w-full my-4 sm:my-8 overflow-x-auto">
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 min-w-max mx-auto px-2 sm:px-0">
          {renderHeader()}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full my-4 sm:my-8 overflow-x-auto">
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 min-w-max mx-auto px-2 sm:px-0">
        {renderHeader()}

      {/* Guess rows - newest first */}
      {reversedGuesses.map((guess, rowIndex) => {
        const results = getTileResults(guess, target)
        // First row (rowIndex === 0) is the newest guess - should slide in from top and flip tiles
        // Other rows were existing - they naturally move down due to layout, but we can add a transition
        const isNewRow = rowIndex === 0 && !slidingRows.has(guess.slug)
        const isExistingRow = slidingRows.has(guess.slug)
        
        return (
          <div 
            key={guess.slug} 
              className={`flex gap-1.5 sm:gap-2 flex-shrink-0 ${isNewRow ? 'row-new' : isExistingRow ? 'row-existing' : ''}`}
          >
            {results.map((tileResult, colIndex) => (
              <Tile
                key={colIndex}
                result={tileResult}
                value={colIndex == 0 ? guess.name : getTileValue(guess, colIndex)}
                companyTile={colIndex == 0 ? true: false}
                logoUrl={colIndex == 0 ? guess.smallLogoUrl : undefined}
                animationDelay={rowIndex === 0 ? colIndex * 0.375 : undefined}
              />
            ))}
          </div>
        )
      })}
      </div>
    </div>
  )
}

