/**
 * Component to display daily solve count
 * 
 * Shows: "{solves} people solved today's YCdle"
 */

import { useYcdleSolves } from '../hooks/useYcdleSolves';

export default function DailySolveCount() {
  const { solves, isLoading } = useYcdleSolves();

  if (isLoading) {
    return (
      <p className="text-xs sm:text-sm text-black opacity-60">
        Loading solve count...
      </p>
    );
  }

  return (
    <p className="text-xs sm:text-sm text-black opacity-60">
      {solves} {solves === 1 ? 'person' : 'people'} solved today's YCdle
    </p>
  );
}

