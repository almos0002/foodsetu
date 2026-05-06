import type { ReactNode } from 'react'
import { cn } from './cn'

type Tab<TValue extends string> = {
  value: TValue
  label: string
  icon?: ReactNode
  count?: number
}

type Props<TValue extends string> = {
  value: TValue
  onChange: (value: TValue) => void
  tabs: Tab<TValue>[]
  className?: string
}

export function Tabs<TValue extends string>({
  value,
  onChange,
  tabs,
  className,
}: Props<TValue>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex flex-wrap items-center gap-1 squircle border border-[var(--color-line)] bg-[var(--color-canvas-2)] p-1',
        className,
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex items-center gap-1.5 squircle px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]',
              active
                ? 'bg-[var(--color-canvas)] text-[var(--color-ink)]'
                : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]',
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === 'number' ? (
              <span
                className={cn(
                  'ml-0.5 inline-flex h-4 min-w-4 items-center justify-center squircle px-1 text-[10px] font-medium tabular-nums',
                  active
                    ? 'bg-[var(--color-canvas-3)] text-[var(--color-ink)]'
                    : 'bg-[var(--color-canvas)] text-[var(--color-ink-3)] border border-[var(--color-line)]',
                )}
              >
                {t.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
