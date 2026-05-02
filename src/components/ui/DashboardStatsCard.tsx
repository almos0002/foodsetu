import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'default' | 'orange' | 'green' | 'blue' | 'amber' | 'red' | 'purple'

const TONES: Record<Tone, string> = {
  default: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-50 text-orange-700',
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  purple: 'bg-purple-50 text-purple-700',
}

type Props = {
  label: string
  value: ReactNode
  icon?: LucideIcon
  hint?: ReactNode
  to?: string
  tone?: Tone
  trailing?: ReactNode
  className?: string
}

export function DashboardStatsCard({
  label,
  value,
  icon: Icon,
  hint,
  to,
  tone = 'default',
  trailing,
  className,
}: Props) {
  const inner = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? (
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md',
                TONES[tone],
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {label}
          </div>
        </div>
        <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
        {hint ? (
          <div className="mt-1 text-xs text-gray-500">{hint}</div>
        ) : null}
      </div>
      {trailing}
    </div>
  )
  const cls = cn(
    'block rounded-lg border border-gray-200 bg-white p-4 transition-colors',
    to && 'hover:border-orange-300',
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
