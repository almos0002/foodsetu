import { Link } from '@tanstack/react-router'
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone =
  | 'default'
  | 'orange'
  | 'green'
  | 'blue'
  | 'amber'
  | 'red'
  | 'purple'

const TONES: Record<Tone, string> = {
  default: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
}

type Trend = {
  /** Positive number = up, negative = down, 0 = flat. */
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
  up: 'text-emerald-600',
  down: 'text-red-600',
  flat: 'text-gray-500',
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
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
          {label}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md',
              TONES[tone],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="font-semibold text-gray-900 text-[28px] leading-none tabular-nums">
          {value}
        </div>
        {trend && TrendIcon ? (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium',
              TREND_TONE[trend.direction],
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {trend.label}
          </div>
        ) : null}
      </div>
      {hint ? (
        <div className="mt-2 text-xs text-gray-500">{hint}</div>
      ) : null}
      {trailing ? <div className="mt-3">{trailing}</div> : null}
    </div>
  )
  const cls = cn(
    'block rounded-lg border border-gray-200 bg-white p-5 transition-colors',
    to && 'hover:border-gray-300',
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
