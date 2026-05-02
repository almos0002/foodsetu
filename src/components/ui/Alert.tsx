import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'info' | 'success' | 'warning' | 'error'

const TONES: Record<Tone, { wrap: string; iconColor: string; icon: typeof Info }> = {
  info: {
    wrap: 'border-[var(--color-info)]/30 bg-[var(--color-info-soft)] text-[var(--color-info-ink)]',
    iconColor: 'text-[var(--color-info)]',
    icon: Info,
  },
  success: {
    wrap: 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]',
    iconColor: 'text-[var(--color-accent)]',
    icon: CheckCircle2,
  },
  warning: {
    wrap: 'border-[var(--color-warn)]/30 bg-[var(--color-warn-soft)] text-[var(--color-warn-ink)]',
    iconColor: 'text-[var(--color-warn)]',
    icon: AlertTriangle,
  },
  error: {
    wrap: 'border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)]',
    iconColor: 'text-[var(--color-danger)]',
    icon: XCircle,
  },
}

type Props = {
  tone?: Tone
  title?: ReactNode
  children?: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, className }: Props) {
  const cfg = TONES[tone]
  const Icon = cfg.icon
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm',
        cfg.wrap,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', cfg.iconColor)} />
      <div className="min-w-0 flex-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        {children ? (
          <div className={cn(title && 'mt-0.5')}>{children}</div>
        ) : null}
      </div>
    </div>
  )
}
