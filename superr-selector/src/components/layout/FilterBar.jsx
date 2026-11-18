import { RotateCcw } from 'lucide-react'
import { COMPETITIONS } from '../../config.js'
import { getFilterOptions } from '../../services/api.js'
import { useApi } from '../../hooks/useApi.js'
import { useFilters } from '../../context/FilterContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { Segmented, SelectField, TextField } from '../ui/Controls.jsx'

// controls: any of 'competition', 'season', 'date'. `children` renders extra page-specific filters.
export default function FilterBar({ controls = ['competition', 'season', 'date'], children, note }) {
  const { filters, setFilter, resetFilters, activeCount, dateRangeInvalid } = useFilters()
  const notify = useToast()
  const options = useApi(function load() {
    return getFilterOptions()
  }, [])

  const seasonOptions = [{ value: 'All', label: 'All seasons' }]
  if (options.data) {
    for (let i = 0; i < options.data.seasons.length; i++) {
      seasonOptions.push({ value: String(options.data.seasons[i]), label: String(options.data.seasons[i]) })
    }
  }
  const bounds = options.data ? options.data.dateBounds : null

  function handleReset() {
    resetFilters()
    notify('Filters reset to defaults.', 'info')
  }

  return (
    <section aria-label="Filters" className="card mb-6 px-4 py-3.5">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        {controls.indexOf('competition') !== -1 ? (
          <div>
            <p className="eyebrow mb-1.5" id="filter-competition-label">
              Competition
            </p>
            <Segmented
              label="Competition"
              options={COMPETITIONS}
              value={filters.competition}
              onChange={function change(value) {
                setFilter('competition', value)
              }}
            />
          </div>
        ) : null}

        {controls.indexOf('season') !== -1 ? (
          <SelectField
            label="Season"
            className="w-36"
            value={String(filters.season)}
            options={seasonOptions}
            onChange={function change(value) {
              setFilter('season', value)
            }}
          />
        ) : null}

        {controls.indexOf('date') !== -1 ? (
          <>
            <TextField
              label="From date"
              type="date"
              className="w-40"
              value={filters.dateFrom}
              min={bounds ? bounds.min : undefined}
              max={bounds ? bounds.max : undefined}
              error={dateRangeInvalid}
              onChange={function change(value) {
                setFilter('dateFrom', value)
              }}
            />
            <TextField
              label="To date"
              type="date"
              className="w-40"
              value={filters.dateTo}
              min={bounds ? bounds.min : undefined}
              max={bounds ? bounds.max : undefined}
              error={dateRangeInvalid}
              onChange={function change(value) {
                setFilter('dateTo', value)
              }}
            />
          </>
        ) : null}

        {children}

        <div className="ml-auto flex items-center gap-3">
          {activeCount > 0 ? (
            <span className="text-xs text-muted">
              {activeCount} filter{activeCount === 1 ? '' : 's'} active
            </span>
          ) : null}
          <button type="button" className="btn btn-sm" onClick={handleReset} disabled={activeCount === 0}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>
      {dateRangeInvalid ? (
        <p className="mt-2 text-xs text-bad" role="alert">
          The start date is after the end date, so no matches can fall in this range.
        </p>
      ) : null}
      {note ? <p className="mt-2 text-xs text-faint">{note}</p> : null}
    </section>
  )
}
