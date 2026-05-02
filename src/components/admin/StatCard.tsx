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
  default:
    'bg-[var(--color-coral)] text-white border-[var(--color-coral)]',
  warning:
    'bg-[var(--color-sun)] text-[var(--color-sun-ink)] border-[var(--color-sun)]',
  success:
    'bg-[var(--color-mint)] text-white border-[var(--color-mint)]',
  danger:
    'bg-[var(--color-berry)] text-white border-[var(--color-berry)]',
}

export function StatCard({ label, value, icon: Icon, hint, to, tone }: Props) {
  const inner = (
    <div className="flex items-start gap-3">
      <div
        className={`-rotate-3 rounded-2xl border-[1.5px] p-2.5 ${TONE[tone ?? 'default']}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="tiny-cap text-[var(--color-ink-2)]">{label}</div>
        <div className="font-display mt-1 text-3xl font-bold leading-none tabular-nums text-[var(--color-ink)]">
          {value}
        </div>
        {hint ? (
          <div className="mt-1 text-xs text-[var(--color-ink-2)]">{hint}</div>
        ) : null}
      </div>
    </div>
  )
  const cls =
    'rounded-[24px] border-[1.5px] border-[var(--color-line)] bg-white p-5 transition-all'
  if (to) {
    return (
      <Link
        to={to}
        className={`${cls} hover:-translate-y-1 hover:border-[var(--color-line-strong)]`}
      >
        {inner}
      </Link>
    )
  }
  return <div className={cls}>{inner}</div>
}
