import type { TileResult } from '../lib/types'

interface TileProps {
  result: TileResult | null;
  value?: string; // The actual value to display (e.g., "W26", "B2B", "Active")
  companyTile?: boolean;
  logoUrl?: string; // Company logo URL for company tiles
  animationDelay?: number; // Delay in seconds for flip animation
}

export default function Tile({ result, value, companyTile, logoUrl, animationDelay = 0 }: TileProps) {
  if (!result) {
    // Empty tile (no guess yet)
    return (
      <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 border-yc-orange border-opacity-30 rounded-lg flex items-center justify-center bg-white flex-shrink-0">
      </div>
    )
  }

  // Define color pairs: border (brighter), background (darker) - same color family
  const getColorStyles = (color: 'green' | 'yellow' | 'red' | 'none') => {
    switch (color) {
      case 'green':
        return {
          borderColor: '#4ade80', // green-400 (brighter)
          backgroundColor: '#16a34a' // green-600 (brighter than 700)
        }
      case 'yellow':
        return {
          borderColor: '#facc15', // yellow-400 (brighter)
          backgroundColor: '#eab308' // yellow-500 (brighter than 600)
        }
      case 'red':
        return {
          borderColor: '#f87171', // red-400 (brighter)
          backgroundColor: '#dc2626' // red-600 (brighter than 700)
        }
      case 'none':
        // yc-orange #f26522 - lighter for border, darker for background
        return {
          borderColor: '#f88a55', // lighter orange (increased brightness)
          backgroundColor: '#cc4d12' // darker orange (reduced brightness)
        }
    }
  }

  // Company tiles should be white background with just the logo
  if (companyTile) {
    return (
      <div 
        className={`w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 border-yc-orange rounded-lg flex items-center justify-center bg-white relative flex-shrink-0 ${animationDelay !== undefined ? 'tile-flip' : ''}`}
        style={{
          ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}s` } : {})
        }}
      >
        {/* White overlay that fades out when animation starts */}
        {animationDelay !== undefined && (
          <div
            className="absolute inset-0 bg-white rounded-lg tile-overlay pointer-events-none z-10"
            style={{ animationDelay: `${animationDelay}s` }}
          />
        )}
        {logoUrl && (
          <img
            src={logoUrl}
            alt={value || 'Company logo'}
            className="w-full h-full object-contain p-1 sm:p-2 relative z-20"
          />
        )}
      </div>
    )
  }

  const colorStyles = getColorStyles(result.color)

  // Function to darken a hex color
  const darkenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)));
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  const arrowColor = darkenColor(colorStyles.backgroundColor, 0.15) // 15% darker (brighter than before)

  return (
    <div
      className={`w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 border-2 rounded-lg flex flex-col items-center justify-center text-white font-bold text-[10px] sm:text-xs md:text-sm p-0.5 sm:p-1 relative overflow-hidden flex-shrink-0 ${animationDelay !== undefined ? 'tile-flip' : ''}`}
      style={{
        borderColor: colorStyles.borderColor,
        ...(animationDelay !== undefined ? { animationDelay: `${animationDelay}s` } : {})
      }}
    >
      {/* YC-orange outline that fades out when animation starts */}
      {animationDelay !== undefined && (
        <div
          className="absolute inset-0 border-2 border-yc-orange rounded-lg tile-overlay pointer-events-none z-10"
          style={{ animationDelay: `${animationDelay}s` }}
        />
      )}
      {/* Background layer - always the correct color, revealed when overlay fades */}
      <div
        className="absolute"
        style={{
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          backgroundColor: colorStyles.backgroundColor,
          borderRadius: '0.5rem', // Match outer border-radius
          zIndex: 0,
        }}
      />
        {/* White overlay that fades out when animation starts */}
        {animationDelay !== undefined && (
          <div
            className="absolute bg-white tile-overlay"
            style={{
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              borderRadius: '0.5rem', // Match outer border-radius
              zIndex: 10,
              animationDelay: `${animationDelay}s`
            }}
          />
        )}
      {result.arrow && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center z-20"
        >
          {result.arrow === 'up' ? (
            <>
              {/* Up arrow: arrowhead on top, stem below (pointing up) - responsive sizing */}
              <div
                className="hidden sm:block"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '36px solid transparent',
                  borderRight: '36px solid transparent',
                  borderBottom: `46px solid ${arrowColor}`,
                }}
              />
              <div
                className="hidden sm:block"
                style={{
                  width: '20px',
                  height: '24px',
                  backgroundColor: arrowColor,
                }}
              />
              {/* Mobile arrow - smaller */}
              <div
                className="sm:hidden"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '20px solid transparent',
                  borderRight: '20px solid transparent',
                  borderBottom: `26px solid ${arrowColor}`,
                }}
              />
              <div
                className="sm:hidden"
                style={{
                  width: '12px',
                  height: '14px',
                  backgroundColor: arrowColor,
                }}
              />
            </>
          ) : (
            <>
              {/* Down arrow: stem on top, arrowhead below (pointing down) - responsive sizing */}
              <div
                className="hidden sm:block"
                style={{
                  width: '20px',
                  height: '24px',
                  backgroundColor: arrowColor,
                }}
              />
              <div
                className="hidden sm:block"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '36px solid transparent',
                  borderRight: '36px solid transparent',
                  borderTop: `46px solid ${arrowColor}`,
                }}
              />
              {/* Mobile arrow - smaller */}
              <div
                className="sm:hidden"
                style={{
                  width: '12px',
                  height: '14px',
                  backgroundColor: arrowColor,
                }}
              />
              <div
                className="sm:hidden"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '20px solid transparent',
                  borderRight: '20px solid transparent',
                  borderTop: `26px solid ${arrowColor}`,
                }}
              />
            </>
          )}
        </div>
      )}
      {value && (
        <span className="text-center leading-tight relative z-20 break-words px-0.5 line-clamp-2 sm:line-clamp-none">{value}</span>
      )}
    </div>
  )
}

