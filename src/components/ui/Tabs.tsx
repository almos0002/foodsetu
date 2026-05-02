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
        'inline-flex flex-wrap items-center gap-1.5 rounded-full border-[1.5px] border-[var(--color-line)] bg-white p-1',
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
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]',
              active
                ? 'bg-[var(--color-ink)] text-white'
                : 'text-[var(--color-ink-2)] hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]',
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === 'number' ? (
              <span
                className={cn(
                  'ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--color-cream)] text-[var(--color-ink-2)]',
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
