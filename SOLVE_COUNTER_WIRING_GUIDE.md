# YCdle Daily Solve Counter - Wiring Guide

## Overview

This implementation adds a daily solve counter that displays "X people solved today's YCdle" using Netlify Functions and Netlify Blobs for persistent storage.

## Files Created/Modified

### Netlify Functions
- `web/netlify/functions/ycdle-solve.ts` - POST endpoint to increment solve count
- `web/netlify/functions/ycdle-stats.ts` - GET endpoint to fetch solve count

### Frontend Files
- `web/src/lib/core/utc-date.ts` - Utility to get UTC dateKey (YYYY-MM-DD) - matches daily puzzle reset time
- `web/src/hooks/useYcdleSolves.ts` - React hook for managing solve count
- `web/src/components/DailySolveCount.tsx` - Component to display solve count
- `web/src/App.tsx` - Integrated solve tracking on win event
- `web/src/lib/core/config.ts` - Added API paths for new endpoints
- `web/src/lib/core/index.ts` - Exported UTC dateKey utilities

### Configuration
- `netlify.toml` - Netlify configuration (created at root)

## How It Works

### 1. Date Key Generation
- Uses **UTC timezone** to match the daily puzzle reset time
- Format: `YYYY-MM-DD` (e.g., `2024-01-15`)
- Both frontend and backend use the same dateKey logic
- Resets at UTC midnight, same as the daily puzzle

### 2. Solve Tracking Flow

**On Win Event (Daily Mode Only):**
1. User wins the daily puzzle
2. `App.tsx` detects win in daily mode (line ~67)
3. Calls `ycdleSolves.recordWin()`
4. Hook checks localStorage: `ycdle_solved_<dateKey>`
5. If not recorded:
   - POST to `/.netlify/functions/ycdle-solve` with `{ dateKey }`
   - Function increments counter in Netlify Blobs
   - localStorage flag set to prevent double-counting
6. UI updates with new count

**Display:**
- `DailySolveCount` component fetches stats on mount
- Displays: "{solves} people solved today's YCdle"
- Only shown in daily mode when game is over

### 3. Storage
- **Netlify Blobs** site-wide store (persists across deploys)
- Store name: `ycdle-solves`
- Keys: `solves:<dateKey>` (e.g., `solves:2024-01-15`)
- Values: Stringified integers

### 4. Double-Counting Prevention
- **Client-side**: localStorage flag `ycdle_solved_<dateKey>=true`
- Only calls solve endpoint if flag is not set
- Idempotent: returns success even if already recorded

## Integration Points

### Win Event Hook Location

**File:** `web/src/App.tsx`

**Location:** Lines 59-85 (in the `useEffect` that watches `gameState.gameState`)

```typescript
// Record win in daily mode (only count wins, not losses)
if (isDailyMode() && gameState.gameState.gameStatus === 'won') {
  ycdleSolves.recordWin()
}
```

**Key Points:**
- ✅ Only triggers in **daily mode** (`isDailyMode()`)
- ✅ Only counts **wins** (`gameStatus === 'won'`)
- ✅ **Unlimited mode is excluded** automatically
- ✅ Called when game state changes to 'won'

### Display Location

**File:** `web/src/App.tsx`

**Location:** Lines 191-199 (Game Status section)

```typescript
{isGameOver && animationsComplete && (
  <div className="mt-4 text-center px-2">
    <p className="text-base sm:text-lg font-semibold text-black">
      {state.gameStatus === 'won' ? '...' : '...'}
    </p>
    {/* Daily solve count (only show in daily mode) */}
    {isDailyMode() && (
      <div className="mt-2">
        <DailySolveCount />
      </div>
    )}
  </div>
)}
```

## Netlify Setup

### 1. Enable Netlify Blobs
- Go to Netlify Dashboard → Your Site → Functions
- Ensure Netlify Blobs is enabled (should be automatic)

### 2. Site-Wide Store Configuration
The functions use `getStore({ name: 'ycdle-solves' })` which creates a site-wide store. Netlify automatically provides the necessary credentials in the Functions environment.

**Note:** If you need to explicitly configure site-wide storage, you may need to:
- Enable it in Netlify Dashboard → Site Settings → Functions
- Or use the Netlify CLI to configure blob stores

### 3. Function Deployment
Functions are automatically deployed when you push to Netlify. The `netlify.toml` file specifies:
```toml
[build]
  functions = "web/netlify/functions"
```

## Testing

### Local Development
1. **Functions**: Use Netlify CLI: `netlify dev` to test functions locally
2. **Frontend**: Run `npm run dev` in the `web` directory

### Testing the Flow
1. Play in **daily mode** (not unlimited)
2. Win the game
3. Check browser console for API calls
4. Verify localStorage: `ycdle_solved_<dateKey>` is set
5. Check that solve count displays and increments

### Testing Double-Count Prevention
1. Win the game (count increments)
2. Refresh page
3. Win again (should NOT increment - localStorage prevents it)
4. Check that count stays the same

## API Endpoints

### POST `/.netlify/functions/ycdle-solve`
**Request:**
```json
{
  "dateKey": "2024-01-15"
}
```

**Response:**
```json
{
  "dateKey": "2024-01-15",
  "solves": 42
}
```

### GET `/.netlify/functions/ycdle-stats?date=2024-01-15`
**Response:**
```json
{
  "dateKey": "2024-01-15",
  "solves": 42
}
```

If `date` parameter is omitted, defaults to today's dateKey (UTC).

## Troubleshooting

### Functions Not Working
- Check Netlify Functions logs in dashboard
- Verify `netlify.toml` configuration
- Ensure `@netlify/blobs` is available (should be in Netlify runtime)

### Count Not Incrementing
- Check browser console for errors
- Verify localStorage flag is not preventing the call
- Check Netlify Functions logs
- Verify you're in daily mode (not unlimited)

### Count Not Displaying
- Verify `isDailyMode()` returns true
- Check that game is over (`isGameOver && animationsComplete`)
- Check browser console for fetch errors

### Date Key Mismatch
- Ensure both frontend and backend use UTC time
- Check `getUTCDateKey()` function in both places
- Verify timezone: UTC (matches daily puzzle reset time)

## Notes

- **Unlimited mode**: Completely excluded from counting (checked via `isDailyMode()`)
- **Losses**: Not counted (only wins are tracked)
- **Persistence**: Site-wide store persists across redeploys
- **Idempotency**: Client-side localStorage prevents duplicate counts
- **Timezone**: All dates use UTC time (matches daily puzzle reset at UTC midnight)

