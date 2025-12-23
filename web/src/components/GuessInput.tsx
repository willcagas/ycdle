import { useState, useRef, useEffect } from 'react'
import type { Company } from '../lib/types'
import { normalizeForComparison } from '../utils/normalization'

interface GuessInputProps {
  companies: Company[];
  onGuess: (slug: string) => void;
  disabled?: boolean;
  previousGuesses: string[];
  showGameOverPlaceholder?: boolean;
}

export default function GuessInput({ companies, onGuess, disabled, previousGuesses, showGameOverPlaceholder = false }: GuessInputProps) {
  const [query, setQuery] = useState('')
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter companies based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredCompanies([])
      setShowDropdown(false)
      return
    }

    const normalizedQuery = normalizeForComparison(query)
    const filtered = companies
      .filter((company) => {
        // Only show companies with "topCompany" badge (knowledge-based recognition requirement)
        const normalizedBadges = company.badges.map(badge => badge.toLowerCase())
        if (!normalizedBadges.includes('topcompany')) return false
        // Skip already guessed companies
        if (previousGuesses.includes(company.slug)) return false
        // Filter by name (case-insensitive substring)
        return normalizeForComparison(company.name).includes(normalizedQuery)
      })
      .slice(0, 10) // Max 10 results

    setFilteredCompanies(filtered)
    setShowDropdown(filtered.length > 0)
    setSelectedIndex(-1)
  }, [query, companies, previousGuesses])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleSelect = (company: Company) => {
    setQuery('')
    setShowDropdown(false)
    setSelectedIndex(-1)
    onGuess(company.slug)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => 
        prev < filteredCompanies.length - 1 ? prev + 1 : prev
      )
      setShowDropdown(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < filteredCompanies.length) {
        handleSelect(filteredCompanies[selectedIndex])
      } else if (filteredCompanies.length === 1) {
        // If only one result, select it
        handleSelect(filteredCompanies[0])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setSelectedIndex(-1)
    }
  }

  const handleFocus = () => {
    if (query.trim() && filteredCompanies.length > 0) {
      setShowDropdown(true)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Don't close dropdown if clicking inside it
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    setShowDropdown(false)
  }

  return (
    <div className="relative w-full max-w-sm mx-auto px-2 sm:px-0">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={showGameOverPlaceholder ? 'Game over' : 'Type a top YC startup name...'}
        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-yc-orange rounded-lg focus:outline-none focus:ring-2 focus:ring-yc-orange bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {showDropdown && filteredCompanies.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border-2 border-yc-orange rounded-lg shadow-lg max-h-64 sm:max-h-96 overflow-y-auto left-0 right-0 mx-2 sm:mx-0"
        >
          {filteredCompanies.map((company, index) => (
            <button
              key={company.slug}
              type="button"
              onClick={() => handleSelect(company)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 text-left hover:bg-yc-orange hover:bg-opacity-10 ${
                index === selectedIndex
                  ? 'bg-yc-orange bg-opacity-10'
                  : ''
              }`}
            >
              {company.smallLogoUrl && (
                <img
                  src={company.smallLogoUrl}
                  alt={company.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base text-black truncate">
                  {company.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

