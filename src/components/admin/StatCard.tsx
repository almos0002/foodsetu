import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  to?: string
  tone?: 'default' | 'warning' | 'success' | 'danger'
}

const TONE: Record<NonNullable<Props['tone']>, string> = {
  default: 'bg-orange-100 text-orange-700',
  warning: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-red-100 text-red-700',
}

export function StatCard({ label, value, icon: Icon, hint, to, tone }: Props) {
  const inner = (
    <div className="flex items-start gap-3">
      <div className={`rounded-lg p-2 ${TONE[tone ?? 'default']}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </div>
        <div className="mt-1 text-2xl font-semibold text-gray-900">
          {value}
        </div>
        {hint ? (
          <div className="mt-0.5 text-xs text-gray-500">{hint}</div>
        ) : null}
      </div>
    </div>
  )
  const cls =
    'rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition'
  if (to) {
    return (
      <Link to={to} className={`${cls} hover:border-orange-300 hover:shadow`}>
        {inner}
      </Link>
    )
  }
  return <div className={cls}>{inner}</div>
}
