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
        'inline-flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1',
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
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-orange-600 text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === 'number' ? (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-1.5 text-[10px] font-semibold',
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600',
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
