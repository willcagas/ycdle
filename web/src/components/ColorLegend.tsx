interface ColorLegendProps {
  onClose?: () => void;
}

export default function ColorLegend({ onClose }: ColorLegendProps) {
  // Function to darken a hex color (same as in Tile component)
  const darkenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)));
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  const redBorderColor = '#f87171'; // red-400 (brighter)
  const redBackgroundColor = '#dc2626'; // red-600
  const greenBorderColor = '#4ade80'; // green-400 (brighter)
  const greenBackgroundColor = '#16a34a'; // green-600
  const yellowBorderColor = '#facc15'; // yellow-400 (brighter)
  const yellowBackgroundColor = '#eab308'; // yellow-500

  const arrowColor = darkenColor(redBackgroundColor, 0.15);

  const legendItems = [
    {
      label: 'Correct',
      borderColor: greenBorderColor,
      backgroundColor: greenBackgroundColor,
      arrow: null as 'up' | 'down' | null,
    },
    {
      label: 'Partial',
      borderColor: yellowBorderColor,
      backgroundColor: yellowBackgroundColor,
      arrow: null as 'up' | 'down' | null,
    },
    {
      label: 'Incorrect',
      borderColor: redBorderColor,
      backgroundColor: redBackgroundColor,
      arrow: null as 'up' | 'down' | null,
    },
    {
      label: 'After',
      borderColor: redBorderColor,
      backgroundColor: redBackgroundColor,
      arrow: 'up' as const,
    },
    {
      label: 'Before',
      borderColor: redBorderColor,
      backgroundColor: redBackgroundColor,
      arrow: 'down' as const,
    },
  ];

  return (
    <div className="relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded flex items-center justify-center hover:bg-red-700 transition-colors"
          aria-label="Close legend"
        >
          <span className="text-sm font-bold">×</span>
        </button>
      )}
      <h3 className="text-center font-semibold text-black mb-4">Color indicators</h3>
      <div className="flex flex-wrap justify-center gap-4">
        {legendItems.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2">
            <div
              className="w-12 h-12 border-2 rounded-lg relative flex items-center justify-center"
              style={{
                borderColor: item.borderColor,
                backgroundColor: item.backgroundColor,
              }}
            >
              {item.arrow && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center">
                  {item.arrow === 'up' ? (
                    <>
                      {/* Up arrow: arrowhead on top, stem below (pointing up) */}
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '12px solid transparent',
                          borderRight: '12px solid transparent',
                          borderBottom: `16px solid ${arrowColor}`,
                        }}
                      />
                      <div
                        style={{
                          width: '6px',
                          height: '8px',
                          backgroundColor: arrowColor,
                        }}
                      />
                    </>
                  ) : (
                    <>
                      {/* Down arrow: stem on top, arrowhead below (pointing down) */}
                      <div
                        style={{
                          width: '6px',
                          height: '8px',
                          backgroundColor: arrowColor,
                        }}
                      />
                      <div
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: '12px solid transparent',
                          borderRight: '12px solid transparent',
                          borderTop: `16px solid ${arrowColor}`,
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
            <span className="text-sm text-black font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

