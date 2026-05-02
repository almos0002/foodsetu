import { Link } from '@tanstack/react-router'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'default' | 'orange' | 'green' | 'blue' | 'amber' | 'red' | 'purple'

const TONES: Record<Tone, string> = {
  default:
    'bg-[var(--color-cream)] text-[var(--color-ink)] border-[var(--color-line-strong)]',
  orange:
    'bg-[var(--color-coral)] text-white border-[var(--color-coral)]',
  green: 'bg-[var(--color-mint)] text-white border-[var(--color-mint)]',
  blue: 'bg-[var(--color-sky)] text-white border-[var(--color-sky)]',
  amber:
    'bg-[var(--color-sun)] text-[var(--color-sun-ink)] border-[var(--color-sun)]',
  red: 'bg-[var(--color-coral)] text-white border-[var(--color-coral)]',
  purple: 'bg-[var(--color-berry)] text-white border-[var(--color-berry)]',
}

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
  up: 'bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)] border-[var(--color-mint)]',
  down: 'bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)] border-[var(--color-coral)]',
  flat: 'bg-[var(--color-cream)] text-[var(--color-ink-2)] border-[var(--color-line-strong)]',
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
  tone = 'default',
  trailing,
  trend,
  className,
}: Props) {
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null
  const inner = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        {Icon ? (
          <div
            className={cn(
              'flex h-12 w-12 -rotate-3 flex-shrink-0 items-center justify-center rounded-2xl border-[1.5px]',
              TONES[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        {trend && TrendIcon ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full border-[1.5px] px-2 py-0.5 text-[11px] font-bold tabular-nums',
              TREND_TONE[trend.direction],
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {trend.label}
          </span>
        ) : null}
      </div>
      <div className="font-display mt-5 text-[36px] font-bold leading-none tracking-tight text-[var(--color-ink)] tabular-nums">
        {value}
      </div>
      <div className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
        {label}
      </div>
      {hint ? (
        <div className="mt-1 text-xs text-[var(--color-ink-2)]">{hint}</div>
      ) : null}
      {trailing ? <div className="mt-3">{trailing}</div> : null}
    </div>
  )
  const cls = cn(
    'block rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white p-6 transition-all',
    to &&
      'hover:-translate-y-1 hover:border-[var(--color-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2',
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
