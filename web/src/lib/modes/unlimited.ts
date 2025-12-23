/**
 * Unlimited mode utilities
 * 
 * Handles random company selection for unlimited play mode.
 */

import type { Company } from '../data'

/**
 * Select a random company from the companies array
 */
export function selectRandomCompany(companies: Company[]): Company {
  if (companies.length === 0) {
    throw new Error('Cannot select random company: companies array is empty');
  }
  
  const randomIndex = Math.floor(Math.random() * companies.length);
  const company = companies[randomIndex];
  
  if (!company) {
    throw new Error('Cannot select random company: failed to select company');
  }
  
  return company;
}

