/**
 * Data access module
 * 
 * This module provides:
 * - Type definitions (Company, CompaniesData, RawCompany, RawCompaniesData)
 * - Data loading (loadCompaniesData)
 * - Lookup utilities (buildLookupMaps)
 * - Filtering utilities (filterTopCompanies, isTopCompany)
 */

export * from './types'
export * from './loader'
export * from './lookup'
export * from './filter'

