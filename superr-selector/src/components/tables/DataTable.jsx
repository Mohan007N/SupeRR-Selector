import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useEffect } from 'react'

// columns: [{ key, header, accessor(row), render?(row), align?, sortable?, sortValue?(row), sticky?, tooltip?, width? }]
// Sorting is controlled by the parent when `sort` and `onSortChange` are given; otherwise it is internal.
export default function DataTable({
  columns,
  rows,
  rowKey,
  onRowClick,
  caption,
  initialSort,
  pageSize = 0,
  emptyMessage = 'No rows to show.',
  rowLabel,
}) {
  const [sort, setSort] = useState(initialSort || { key: null, direction: 'desc' })
  const [page, setPage] = useState(0)

  const sorted = useMemo(
    function sortRows() {
      if (!sort.key) {
        return rows
      }
      let column = null
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].key === sort.key) {
          column = columns[i]
        }
      }
      if (column === null) {
        return rows
      }
      const read = column.sortValue || column.accessor
      const copy = rows.slice()
      copy.sort(function compare(a, b) {
        const va = read(a)
        const vb = read(b)
        // Missing values always sink to the bottom.
        const aMissing = va === null || va === undefined || Number.isNaN(va)
        const bMissing = vb === null || vb === undefined || Number.isNaN(vb)
        if (aMissing && bMissing) return 0
        if (aMissing) return 1
        if (bMissing) return -1
        let result
        if (typeof va === 'string') {
          result = va.localeCompare(vb)
        } else {
          result = va - vb
        }
        return sort.direction === 'asc' ? result : -result
      })
      return copy
    },
    [rows, columns, sort],
  )

  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const safePage = Math.min(page, pageCount - 1)

  // Go back to page one when the data set changes.
  useEffect(
    function resetPage() {
      setPage(0)
    },
    [rows],
  )

  const visible = pageSize > 0 ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize) : sorted

  function toggleSort(column) {
    if (sort.key === column.key) {
      setSort({ key: column.key, direction: sort.direction === 'desc' ? 'asc' : 'desc' })
    } else {
      setSort({ key: column.key, direction: column.defaultDirection || (typeof column.accessor(rows[0] || {}) === 'string' ? 'asc' : 'desc') })
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-max border-collapse text-[13px]">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-line bg-bg-raised">
              {columns.map(function renderHead(column) {
                const sortable = column.sortable !== false
                const active = sort.key === column.key
                const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sortable ? ariaSort : undefined}
                    title={column.tooltip}
                    className={
                      'px-3 py-2.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted ' +
                      (column.align === 'right' ? 'text-right ' : 'text-left ') +
                      (column.sticky ? 'sticky left-0 z-10 bg-bg-raised ' : '')
                    }
                    style={column.width ? { minWidth: column.width } : undefined}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={function click() {
                          toggleSort(column)
                        }}
                        className={
                          'inline-flex items-center gap-1 uppercase tracking-[0.1em] transition-colors hover:text-fg ' +
                          (column.align === 'right' ? 'flex-row-reverse ' : '') +
                          (active ? 'text-accent' : '')
                        }
                      >
                        {column.header}
                        {active ? (
                          sort.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="h-3 w-3" aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map(function renderRow(row) {
                const clickable = Boolean(onRowClick)
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={
                      clickable
                        ? function click() {
                            onRowClick(row)
                          }
                        : undefined
                    }
                    className={'group border-b border-line last:border-b-0 transition-colors ' + (clickable ? 'cursor-pointer hover:bg-panel-2' : '')}
                  >
                    {columns.map(function renderCell(column, index) {
                      const content = column.render ? column.render(row) : column.accessor(row)
                      const isFirst = index === 0
                      return (
                        <td
                          key={column.key}
                          className={
                            'px-3 py-2.5 ' +
                            (column.align === 'right' ? 'num text-right ' : '') +
                            (column.sticky ? 'sticky left-0 z-[1] bg-panel group-hover:bg-panel-2 ' : '')
                          }
                        >
                          {isFirst && clickable ? (
                            <button
                              type="button"
                              onClick={function click(event) {
                                event.stopPropagation()
                                onRowClick(row)
                              }}
                              className="text-left font-medium text-fg hover:text-accent"
                              aria-label={rowLabel ? rowLabel(row) : undefined}
                            >
                              {content}
                            </button>
                          ) : (
                            content
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pageSize > 0 && sorted.length > pageSize ? (
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>
            Showing {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm"
              disabled={safePage === 0}
              onClick={function prev() {
                setPage(safePage - 1)
              }}
            >
              Previous
            </button>
            <span className="num">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              disabled={safePage >= pageCount - 1}
              onClick={function next() {
                setPage(safePage + 1)
              }}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
