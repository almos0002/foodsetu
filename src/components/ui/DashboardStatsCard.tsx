import { Link } from '@tanstack/react-router'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'default' | 'orange' | 'green' | 'blue' | 'amber' | 'red' | 'purple'

const TONES: Record<Tone, string> = {
  default: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
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
  up: 'bg-emerald-50 text-emerald-700',
  down: 'bg-red-50 text-red-700',
  flat: 'bg-gray-100 text-gray-600',
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
              'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
              TONES[tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        {trend && TrendIcon ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
              TREND_TONE[trend.direction],
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {trend.label}
          </span>
        ) : null}
      </div>
      <div className="mt-5 text-[32px] font-semibold leading-none tracking-tight text-gray-900 tabular-nums">
        {value}
      </div>
      <div className="mt-2 text-sm font-medium text-gray-700">{label}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
      {trailing ? <div className="mt-3">{trailing}</div> : null}
    </div>
  )
  const cls = cn(
    'block rounded-2xl border border-gray-200 bg-white p-5 transition-all',
    to &&
      'hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
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
