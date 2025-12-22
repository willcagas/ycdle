import { useState } from 'react'
import type { Company } from '../lib/types'
import { getTileResults, MAX_GUESSES } from '../lib/gameEngine'
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
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-4 w-md max-w-2xl mx-4 border-2 border-yc-orange"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-3 text-black">
          {gameStatus === 'won' ? '🎉 You Won!' : 'Game Over'}
        </h2>

        <CompanyReveal company={target} />

        <div className="mt-3">
          <p className="text-sm font-semibold mb-1.5 text-black">
            Share your results:
          </p>
          <div className="bg-black border border-yc-orange p-2 rounded font-mono text-xs whitespace-pre-wrap mb-2 text-white">
            {shareText}
          </div>
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 bg-yc-orange text-white rounded-lg hover:opacity-90 mb-2"
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onNewGame}
            className="flex-1 px-4 py-2 bg-white border-2 border-yc-orange text-yc-orange rounded-lg hover:bg-yc-orange hover:text-white transition-colors"
          >
            New Game
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border-2 border-yc-orange text-yc-orange rounded-lg hover:bg-yc-orange hover:text-white transition-colors"
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
  lines.push('YC Guesser')

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

