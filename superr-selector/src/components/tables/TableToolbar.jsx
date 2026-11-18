import { useId } from 'react'
import { Download, Search, X } from 'lucide-react'

// Search box + result count + CSV export button shared by the batting and bowling tables.
export default function TableToolbar({ query, onQueryChange, placeholder, count, total, onExport, exportDisabled, children }) {
  const id = useId()
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-72">
        <label htmlFor={id} className="sr-only">
          {placeholder}
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={query}
          placeholder={placeholder}
          onChange={function change(event) {
            onQueryChange(event.target.value)
          }}
          className="field pl-9 pr-9"
        />
        {query ? (
          <button
            type="button"
            onClick={function clear() {
              onQueryChange('')
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {children}
      <p className="num ml-auto text-xs text-muted" aria-live="polite">
        {count === total ? total + ' players' : count + ' of ' + total + ' players'}
      </p>
      <button type="button" className="btn btn-sm" onClick={onExport} disabled={exportDisabled}>
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Export CSV
      </button>
    </div>
  )
}
