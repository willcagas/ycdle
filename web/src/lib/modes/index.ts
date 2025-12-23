/**
 * Game mode selection module
 * 
 * This module provides:
 * - Type definitions (GameMode)
 * - Mode detection (getGameMode, setGameMode, isDailyMode, isUnlimitedMode)
 * - Daily mode utilities (fetchDailyCompanyId, shouldUseDailyMode)
 * - Unlimited mode utilities (selectRandomCompany)
 */

export * from './types'
export * from './detection'
export * from './daily'
export * from './unlimited'

