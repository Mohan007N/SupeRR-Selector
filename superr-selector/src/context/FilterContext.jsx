import { createContext, useContext, useMemo, useState } from 'react'

const DEFAULT_FILTERS = { competition: 'All', season: 'All', dateFrom: '', dateTo: '' }

const FilterContext = createContext(null)

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const value = useMemo(
    function buildValue() {
      function setFilter(key, newValue) {
        setFilters(function update(previous) {
          return { ...previous, [key]: newValue }
        })
      }
      function resetFilters() {
        setFilters(DEFAULT_FILTERS)
      }

      let activeCount = 0
      if (filters.competition !== 'All') activeCount += 1
      if (filters.season !== 'All') activeCount += 1
      if (filters.dateFrom) activeCount += 1
      if (filters.dateTo) activeCount += 1

      const dateRangeInvalid = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo)

      return {
        filters: filters,
        // Stable string that data hooks can depend on.
        filtersKey: [filters.competition, filters.season, filters.dateFrom, filters.dateTo].join('|'),
        setFilter: setFilter,
        resetFilters: resetFilters,
        activeCount: activeCount,
        dateRangeInvalid: dateRangeInvalid,
      }
    },
    [filters],
  )

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useFilters() {
  const value = useContext(FilterContext)
  if (value === null) {
    throw new Error('useFilters must be used inside FilterProvider')
  }
  return value
}
