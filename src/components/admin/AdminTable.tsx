import { Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}

export type FilterChip<F extends string> = {
  value: F
  label: string
  count?: number
}

type Props<T, F extends string> = {
  rows: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKeys?: (keyof T | ((row: T) => string | null | undefined))[]
  filters?: FilterChip<F>[]
  filterValue?: F
  onFilterChange?: (value: F) => void
  emptyLabel?: string
  rowKey: (row: T) => string
}

function alignClass(a: Column<unknown>['align']) {
  switch (a) {
    case 'right':
      return 'text-right'
    case 'center':
      return 'text-center'
    default:
      return 'text-left'
  }
}

export function AdminTable<T, F extends string>({
  rows,
  columns,
  searchPlaceholder,
  searchKeys,
  filters,
  filterValue,
  onFilterChange,
  emptyLabel,
  rowKey,
}: Props<T, F>) {
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    if (!query.trim() || !searchKeys || searchKeys.length === 0) return rows
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      for (const key of searchKeys) {
        const v =
          typeof key === 'function'
            ? key(row)
            : ((row as Record<string, unknown>)[key as string] as
                | string
                | null
                | undefined)
        if (typeof v === 'string' && v.toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [rows, query, searchKeys])

  const showSearch = searchPlaceholder && searchKeys && searchKeys.length > 0

  return (
    <div className="space-y-3">
      {(showSearch || filters) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {filters ? (
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((f) => {
                const active = filterValue === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => onFilterChange?.(f.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors ${
                      active
                        ? 'bg-orange-600 text-white ring-orange-600'
                        : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                    {typeof f.count === 'number' ? (
                      <span
                        className={`ml-1.5 text-[10px] ${
                          active ? 'opacity-90' : 'text-gray-500'
                        }`}
                      >
                        {f.count}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : (
            <div />
          )}
          {showSearch ? (
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-3 ${alignClass(c.align)} ${c.className ?? ''}`}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    {query.trim()
                      ? `No results for "${query.trim()}".`
                      : (emptyLabel ?? 'No records.')}
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-gray-50">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-4 py-3 ${alignClass(c.align)} ${c.className ?? ''}`}
                      >
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-right text-xs text-gray-500">
        {visible.length} of {rows.length}
      </div>
    </div>
  )
}
