import { useState, useEffect } from 'react'
import { getTimeUntilNextMidnight, getLocalMidnightTime } from '../lib/core'

/**
 * Format time with leading zeros
 */
function formatTime(value: number): string {
  return value.toString().padStart(2, '0');
}

export default function DailyCountdown() {
  const [time, setTime] = useState(getTimeUntilNextMidnight());
  const [localMidnight, setLocalMidnight] = useState(getLocalMidnightTime());
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilNextMidnight());
      setLocalMidnight(getLocalMidnightTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <p className="text-[10px] sm:text-xs font-medium text-black opacity-70 mb-1.5 sm:mb-2">Next startup in</p>
      <div className="text-lg sm:text-xl font-mono font-bold text-yc-orange mb-1.5 sm:mb-2">
        {formatTime(time.hours)}:{formatTime(time.minutes)}:{formatTime(time.seconds)}
      </div>
      <div className="text-[9px] sm:text-[10px] text-black opacity-60 px-2">
        Resets at UTC midnight ({localMidnight} {timezone})
      </div>
    </div>
  );
}

