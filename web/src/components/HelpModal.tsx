import ColorLegend from './ColorLegend'
import DailyCountdown from './DailyCountdown'

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null

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
          How to Play
        </h2>

        {/* Introduction */}
        <div className="mb-6">
          <p className="text-black text-sm sm:text-base leading-relaxed text-center">
            Guess the top YC startup in <span className="font-semibold text-yc-orange">6 tries</span>! 
            Each guess shows feedback tiles with color-coded hints.
          </p>
        </div>

        {/* Color Legend Section */}
        <div className="mb-8">
          <h3 className="text-sm sm:text-base font-semibold text-black mb-3 text-center">Color indicators</h3>
          <ColorLegend />
        </div>

        {/* Properties Section */}
        <div className="mb-8">
          <h3 className="text-sm sm:text-base font-semibold text-black mb-3 text-center">Properties to Compare</h3>
          <div className="space-y-2">
            <div>
              <div className="font-semibold text-sm text-black mb-0.5">Batch</div>
              <div className="text-xs text-black opacity-70">
                The batch when the company was accepted (e.g., F25 = Fall 2025)
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm text-black mb-0.5">Industry</div>
              <div className="text-xs text-black opacity-70">
                The primary business industry (e.g., B2B, Healthcare, Fintech)
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm text-black mb-0.5">Status</div>
              <div className="text-xs text-black opacity-70">
                The company's current operational status (e.g., Active, Acquired, Inactive)
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm text-black mb-0.5">Badges</div>
              <div className="text-xs text-black opacity-70">
                Special YC designations (e.g., Top Company)
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm text-black mb-0.5">Regions</div>
              <div className="text-xs text-black opacity-70">
                Geographic regions where the company operates (e.g., US, Canada)
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Section */}
        <div className="mb-4">
          <DailyCountdown />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-3 sm:px-4 py-2 bg-white border-2 border-yc-orange text-yc-orange text-sm sm:text-base rounded-lg hover:bg-yc-orange hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

