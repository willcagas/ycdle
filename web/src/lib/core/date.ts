/**
 * UTC date/time utilities
 * 
 * Single source of truth for UTC day calculation.
 * This logic MUST match the Netlify function exactly.
 * See: web/netlify/functions/daily/index.js
 */

import { MILLISECONDS_PER_DAY } from '../game/constants'

/**
 * Get UTC day number (days since epoch)
 * 
 * This function must match the Netlify function exactly:
 * - Creates a Date object at UTC midnight for today
 * - Calculates days since epoch (Jan 1, 1970)
 * - Returns the same value for all times within the same UTC day
 */
export function getUTCDayNumber(): number {
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
  // Days since epoch (Jan 1, 1970)
  return Math.floor(utcDate.getTime() / MILLISECONDS_PER_DAY);
}

/**
 * Get the next UTC midnight as a Date object
 */
export function getNextUTCMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
}

/**
 * Get seconds until next UTC midnight
 */
export function getSecondsUntilNextUTCMidnight(): number {
  const nextMidnight = getNextUTCMidnight();
  return Math.floor((nextMidnight.getTime() - Date.now()) / 1000);
}

/**
 * Calculate time until next UTC midnight
 */
export function getTimeUntilNextMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const nextMidnight = getNextUTCMidnight();
  const diff = nextMidnight.getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

/**
 * Get what UTC midnight is in the user's local time
 * Returns formatted string like "16:00"
 */
export function getLocalMidnightTime(): string {
  const nextUTCMidnight = getNextUTCMidnight();
  
  // Format UTC midnight in user's local timezone
  const localHours = nextUTCMidnight.getHours();
  const localMinutes = nextUTCMidnight.getMinutes();
  
  return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
}

