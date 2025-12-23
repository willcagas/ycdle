import { useEffect, useState } from 'react'
import { loadCompaniesData } from './lib/dataLoader'
import { useGameState } from './hooks/useGameState'
import GuessInput from './components/GuessInput'
import GameGrid from './components/GameGrid'
import HelpModal from './components/HelpModal'
import EndModal from './components/EndModal'
import './App.css'

function App() {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadCompaniesData>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)

  useEffect(() => {
    loadCompaniesData()
      .then((result) => {
        setData(result)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const gameState = useGameState(
    data
      ? {
          companies: data.companies,
          bySlug: data.bySlug,
          byId: data.byId,
          datasetVersion: data.data.version,
        }
      : {
          companies: [],
          bySlug: new Map(),
          byId: new Map(),
          datasetVersion: '',
        }
  )

  // Show end modal when game ends, but wait for animations to complete
  useEffect(() => {
    if (gameState.gameState) {
      const isGameOver = gameState.gameState.gameStatus === 'won' || gameState.gameState.gameStatus === 'lost'
      if (isGameOver) {
        // Wait for tile flip animations to complete
        // Each tile takes 1.0s to flip, with staggered delays (last tile starts at ~1.875s)
        // Total animation time is approximately 2.875s, so wait 3s to be safe
        const animationTimeout = setTimeout(() => {
          setShowEndModal(true)
        }, 3000)
        
        return () => clearTimeout(animationTimeout)
      } else {
        // Reset modal state when game is not over
        setShowEndModal(false)
      }
    }
  }, [gameState.gameState?.gameStatus])

  if (loading || gameState.loadingDaily) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-black">Loading companies data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xl text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!data || !gameState.gameState) {
    return null
  }

  const { gameState: state, makeGuess, startNewGame, getTargetCompany, getGuessCompanies } =
    gameState

  const target = getTargetCompany()
  const guesses = getGuessCompanies()
  const isGameOver = state.gameStatus === 'won' || state.gameStatus === 'lost'

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex">
              <h1 className="text-4xl font-bold text-yc-orange mb-2">
                YC
              </h1>
              <h1 className="text-4xl font-bold text-black mb-2">
                dle
              </h1>
            </div>
            <p className="text-base text-black mb-2 font-medium">
              Test how well you know{' '}
              <a
                href="https://www.ycombinator.com/companies?top_company=true"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yc-orange hover:underline"
              >
                top YC companies
              </a>
              .
            </p>
            {/* <p className="text-sm text-black opacity-70 ">
              {data.data.count} companies • Version {data.data.version}
            </p> */}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="px-4 py-2 bg-white border-2 border-yc-orange text-yc-orange rounded-lg hover:bg-yc-orange hover:text-white transition-colors"
            >
              Help
            </button>
            <button
              onClick={startNewGame}
              className="px-4 py-2 bg-yc-orange text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              New Game
            </button>
          </div>
        </div>

        {/* Guess Input */}
        <div className="mt-8">
          <GuessInput
            companies={data.companies}
            onGuess={makeGuess}
            disabled={isGameOver}
            previousGuesses={state.guesses}
          />
        </div>

        {/* Game Grid */}
        <GameGrid guesses={guesses} target={target} />

        {/* Game Status */}
        {isGameOver && (
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-black">
              {state.gameStatus === 'won'
                ? `🎉 You won in ${state.guesses.length} guess${state.guesses.length !== 1 ? 'es' : ''}!`
                : 'Game Over. Better luck next time!'}
            </p>
          </div>
        )}

        {/* Modals */}
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        {target && isGameOver && (
          <EndModal
            isOpen={showEndModal}
            onClose={() => setShowEndModal(false)}
            onNewGame={() => {
              setShowEndModal(false)
              startNewGame()
            }}
            target={target}
            guesses={guesses}
            gameStatus={state.gameStatus as 'won' | 'lost'}
          />
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-black opacity-60">
            Not affiliated with YC
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
