import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}

export type FilterChip<TFilter extends string> = {
  value: TFilter
  label: string
  count?: number
}

type Props<T, TFilter extends string> = {
  rows: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKeys?: (keyof T | ((row: T) => string | null | undefined))[]
  filters?: FilterChip<TFilter>[]
  filterValue?: TFilter
  onFilterChange?: (value: TFilter) => void
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

export function AdminTable<T, TFilter extends string>({
  rows,
  columns,
  searchPlaceholder,
  searchKeys,
  filters,
  filterValue,
  onFilterChange,
  emptyLabel,
  rowKey,
}: Props<T, TFilter>) {
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
    <div className="space-y-4">
      {(showSearch || filters) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {filters ? (
            <div className="inline-flex flex-wrap items-center gap-1 squircle border border-[var(--color-line)] bg-[var(--color-canvas-2)] p-1">
              {filters.map((f) => {
                const active = filterValue === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => onFilterChange?.(f.value)}
                    className={`inline-flex items-center gap-1.5 squircle px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--color-canvas)] text-[var(--color-ink)] shadow-sm'
                        : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]'
                    }`}
                  >
                    {f.label}
                    {typeof f.count === 'number' ? (
                      <span
                        className={`inline-flex h-4 min-w-4 items-center justify-center squircle px-1 text-[10px] font-medium tabular-nums ${
                          active
                            ? 'bg-[var(--color-canvas-3)] text-[var(--color-ink)]'
                            : 'bg-[var(--color-canvas)] text-[var(--color-ink-3)] border border-[var(--color-line)]'
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
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-3)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full squircle border border-[var(--color-line)] bg-[var(--color-canvas)] py-2 pl-9 pr-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-canvas-3)]"
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="overflow-hidden squircle border border-[var(--color-line)] bg-[var(--color-canvas)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--color-line)] bg-[var(--color-canvas-2)] text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`px-4 py-2.5 ${alignClass(c.align)} ${c.className ?? ''}`}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-[var(--color-ink-2)]"
                  >
                    {query.trim()
                      ? `No results for "${query.trim()}".`
                      : (emptyLabel ?? 'No records.')}
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className="transition-colors hover:bg-[var(--color-canvas-2)]"
                  >
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

      <div className="text-right text-xs text-[var(--color-ink-3)]">
        {visible.length} of {rows.length}
      </div>
    </div>
  )
}
