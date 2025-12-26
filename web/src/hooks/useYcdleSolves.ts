/**
 * Hook for managing daily solve count
 * 
 * Fetches and tracks the number of people who solved today's YCdle.
 * Handles localStorage to prevent double-counting.
 */

import { useState, useEffect, useCallback } from 'react';
import { getUTCDateKey } from '../lib/core';
import { API_PATHS } from '../lib/core/config';

interface SolveStats {
    dateKey: string;
    solves: number;
}

/**
 * Get localStorage key for tracking if user has already recorded a solve
 */
function getLocalStorageKey(dateKey: string): string {
    return `ycdle_solved_${dateKey}`;
}

/**
 * Check if user has already recorded a solve for today
 */
function hasRecordedSolve(dateKey: string): boolean {
    try {
        return localStorage.getItem(getLocalStorageKey(dateKey)) === 'true';
    } catch {
        return false;
    }
}

/**
 * Mark that user has recorded a solve for today
 */
function markSolveRecorded(dateKey: string): void {
    try {
        localStorage.setItem(getLocalStorageKey(dateKey), 'true');
    } catch (error) {
        console.error('Failed to save solve record to localStorage:', error);
    }
}

/**
 * Fetch solve stats from the API
 */
async function fetchSolveStats(dateKey: string): Promise<SolveStats> {
    try {
        const response = await fetch(`${API_PATHS.YCDLE_STATS}?date=${encodeURIComponent(dateKey)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch stats: ${response.status}`);
        }

        const data: SolveStats = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching solve stats:', error);
        // Return default stats on error
        return { dateKey, solves: 0 };
    }
}

/**
 * Record a solve (increment counter)
 */
async function recordSolve(dateKey: string): Promise<SolveStats | null> {
    try {
        const response = await fetch(API_PATHS.YCDLE_SOLVE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dateKey }),
        });

        if (!response.ok) {
            throw new Error(`Failed to record solve: ${response.status}`);
        }

        const data: SolveStats = await response.json();
        return data;
    } catch (error) {
        console.error('Error recording solve:', error);
        return null;
    }
}

/**
 * Hook for managing daily solve count
 * 
 * @returns Object with:
 *   - solves: number of solves for today
 *   - isLoading: whether stats are being fetched
 *   - recordWin: function to call when user wins (only counts once per day)
 *   - refresh: function to manually refresh stats
 */
export function useYcdleSolves() {
    const [solves, setSolves] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch stats on mount
    useEffect(() => {
        let cancelled = false;

        async function fetchStats() {
            const currentDateKey = getUTCDateKey();
            setIsLoading(true);

            const stats = await fetchSolveStats(currentDateKey);
            if (!cancelled) {
                setSolves(stats.solves);
                setIsLoading(false);
            }
        }

        fetchStats();

        return () => {
            cancelled = true;
        };
    }, []);

    // Fetch stats function for manual refresh
    const refresh = useCallback(async () => {
        const currentDateKey = getUTCDateKey();
        setIsLoading(true);

        const stats = await fetchSolveStats(currentDateKey);
        setSolves(stats.solves);
        setIsLoading(false);
    }, []);

    // Record a win (only if not already recorded for today)
    const recordWin = useCallback(async (): Promise<void> => {
        const currentDateKey = getUTCDateKey();

        // Check if already recorded
        if (hasRecordedSolve(currentDateKey)) {
            // Already recorded, just refresh stats
            await refresh();
            return;
        }

        // Record the solve
        const result = await recordSolve(currentDateKey);

        if (result) {
            // Mark as recorded in localStorage
            markSolveRecorded(currentDateKey);
            // Update solves count
            setSolves(result.solves);
        } else {
            // If recording failed, still refresh to get latest count
            await refresh();
        }
    }, [refresh]);

    return {
        solves,
        isLoading,
        recordWin,
        refresh,
    };
}

