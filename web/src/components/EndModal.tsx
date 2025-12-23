import { useState } from 'react'
import type { Company } from '../lib/types'
import { getTileResults, MAX_GUESSES } from '../lib/gameEngine'
import { isDailyMode } from '../lib/gameMode'
import CompanyReveal from './CompanyReveal'

interface EndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewGame: () => void;
  target: Company;
  guesses: Company[];
  gameStatus: 'won' | 'lost';
}

export default function EndModal({
  isOpen,
  onClose,
  onNewGame,
  target,
  guesses,
  gameStatus,
}: EndModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const shareText = generateShareText(guesses, target, gameStatus)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 border-2 border-yc-orange max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-black text-center">
          {gameStatus === 'won' ? '🎉 You Won!' : 'Game Over'}
        </h2>

        <CompanyReveal company={target} />

        <div className="mt-3">
          <p className="text-xs sm:text-sm font-semibold mb-1.5 text-black text-center">
            Share your results:
          </p>
          <div className="bg-black border border-yc-orange p-2 sm:p-3 rounded font-mono text-[10px] sm:text-xs whitespace-pre-wrap mb-2 text-white overflow-x-auto text-center">
            {shareText}
          </div>
          <button
            onClick={handleCopy}
            className="w-full px-3 sm:px-4 py-2 bg-yc-orange text-white text-sm sm:text-base rounded-lg hover:opacity-90 mb-2"
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {!isDailyMode() && (
            <button
              onClick={onNewGame}
              className="w-full sm:flex-1 px-3 sm:px-4 py-2 bg-white border-2 border-yc-orange text-yc-orange text-sm sm:text-base rounded-lg hover:bg-yc-orange hover:text-white transition-colors"
            >
              New Game
            </button>
          )}
          <button
            onClick={onClose}
            className={isDailyMode() ? "w-full px-3 sm:px-4 py-2 bg-white border-2 border-yc-orange text-yc-orange text-sm sm:text-base rounded-lg hover:bg-yc-orange hover:text-white transition-colors" : "w-full sm:flex-1 px-3 sm:px-4 py-2 bg-white border-2 border-yc-orange text-yc-orange text-sm sm:text-base rounded-lg hover:bg-yc-orange hover:text-white transition-colors"}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function generateShareText(
  guesses: Company[],
  target: Company,
  gameStatus: 'won' | 'lost'
): string {
  const lines: string[] = []
  lines.push('YCdle')

  if (gameStatus === 'won') {
    lines.push(`Solved in ${guesses.length}/${MAX_GUESSES}`)
  } else {
    lines.push(`Lost after ${MAX_GUESSES} guesses`)
  }

  lines.push('') // Empty line

  // Generate emoji grid
  for (const guess of guesses) {
    const results = getTileResults(guess, target)
    const emojiRow: string[] = []
    for (const result of results) {
      if (result.color === 'green') {
        emojiRow.push('🟢')
      } else if (result.color === 'yellow') {
        emojiRow.push('🟡')
        // Arrow appears after yellow tile for batch comparisons
        if (result.arrow === 'up') {
          emojiRow.push('⬆️')
        } else if (result.arrow === 'down') {
          emojiRow.push('⬇️')
        }
      } else {
        emojiRow.push('🔴')
      }
    }
    lines.push(emojiRow.join(''))
  }

  lines.push('') // Empty line
  lines.push('https://ycdle.com')

  return lines.join('\n')
}

