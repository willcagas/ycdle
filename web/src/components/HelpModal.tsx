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
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-xl w-full mx-4 border-2 border-yc-orange max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-black text-left">
          How to Play
        </h2>
        <div className="space-y-4 text-black text-left">
          <p className="text-left">
            Guess the top YC startup in 6 tries! Each guess shows feedback tiles:
          </p>
          <div className="my-4 mb-6">
            <ColorLegend />
          </div>
          <div className="mt-4 space-y-2 text-left">
            <p className="font-semibold text-left text-xl mb-4">Properties</p>
            <div className="space-y-2 text-left">
              <div>
                <strong>Batch:</strong> The batch when the company was accepted 
                (e.g., F25 = Fall 2025).
              </div>
              <div>
                <strong>Industry:</strong> The primary business industry (e.g., B2B, 
                Healthcare, Fintech).
              </div>
              <div>
                <strong>Status:</strong> The company's current operational status (e.g., Active, 
                Acquired, Inactive).
              </div>
              <div>
                <strong>Badges:</strong> Special YC designations (e.g., Top Company).
              </div>
              <div>
                <strong>Regions:</strong> Geographic regions where the company operates (e.g., 
                US, Canada).
              </div>
            </div>
          </div>
          <DailyCountdown />
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-yc-orange text-white rounded-lg hover:opacity-90"
        >
          Got it!
        </button>
      </div>
    </div>
  )
}

