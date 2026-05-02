import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

/** `tone` is accepted for backwards-compat with older callsites but
 *  rendered identically — the design language is single-accent monochrome. */
type Props = {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  to?: string
  tone?: 'default' | 'warning' | 'success' | 'danger'
}

export function StatCard({ label, value, icon: Icon, hint, to }: Props) {
  const inner = (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--color-ink-3)]" />
      <div className="min-w-0 flex-1">
        <div className="tiny-cap text-[var(--color-ink-3)]">{label}</div>
        <div className="mt-1.5 text-[26px] font-semibold leading-none tabular-nums tracking-tight text-[var(--color-ink)]">
          {value}
        </div>
        {hint ? (
          <div className="mt-1 text-xs text-[var(--color-ink-3)]">{hint}</div>
        ) : null}
      </div>
    </div>
  )
  const cls =
    'rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-5 transition-colors'
  if (to) {
    return (
      <Link to={to} className={`${cls} hover:border-[var(--color-line-strong)]`}>
        {inner}
      </Link>
    )
  }
  return <div className={cls}>{inner}</div>
}
