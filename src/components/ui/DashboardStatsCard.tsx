import { Link } from '@tanstack/react-router'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

/** `tone` is accepted for backwards-compat with older dashboard callsites
 *  but is rendered identically — the design language is single-accent
 *  monochrome. Trend indicators keep their semantic colour (up/down/flat). */
type Tone = 'default' | 'orange' | 'green' | 'blue' | 'amber' | 'red' | 'purple'

type Trend = {
  direction: 'up' | 'down' | 'flat'
  label: string
}

type Props = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  hint?: ReactNode
  to?: string
  tone?: Tone
  trailing?: ReactNode
  trend?: Trend
  className?: string
}

const TREND_TONE: Record<Trend['direction'], string> = {
  up: 'text-[var(--color-accent)]',
  down: 'text-[var(--color-danger)]',
  flat: 'text-[var(--color-ink-3)]',
}
const TREND_ICON: Record<Trend['direction'], typeof ArrowUpRight> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
}

export function DashboardStatsCard({
  label,
  value,
  icon: Icon,
  hint,
  to,
  trailing,
  trend,
  className,
}: Props) {
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null
  const inner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="tiny-cap text-[var(--color-ink-3)]">{label}</div>
        {Icon ? (
          <Icon className="h-4 w-4 flex-shrink-0 text-[var(--color-ink-3)]" />
        ) : null}
      </div>
      <div className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-[var(--color-ink)] tabular-nums">
        {value}
      </div>
      {(trend && TrendIcon) || hint ? (
        <div className="mt-2.5 flex items-center gap-2">
          {trend && TrendIcon ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
                TREND_TONE[trend.direction],
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {trend.label}
            </span>
          ) : null}
          {hint ? (
            <div className="text-xs text-[var(--color-ink-3)]">{hint}</div>
          ) : null}
        </div>
      ) : null}
      {trailing ? <div className="mt-3">{trailing}</div> : null}
    </div>
  )
  const cls = cn(
    'block rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-5 transition-colors',
    to &&
      'hover:border-[var(--color-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2',
    className,
  )
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    )
  }
  return <div className={cls}>{inner}</div>
}
