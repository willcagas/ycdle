import { useState, useEffect } from 'react'

/**
 * Calculate time until next UTC midnight
 */
function getTimeUntilNextMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  
  const diff = nextMidnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

/**
 * Format time with leading zeros
 */
function formatTime(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Get what UTC midnight is in the user's local time
 */
function getLocalMidnightTime(): string {
  const now = new Date();
  const nextUTCMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  
  // Format UTC midnight in user's local timezone
  const localHours = nextUTCMidnight.getHours();
  const localMinutes = nextUTCMidnight.getMinutes();
  
  return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
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

