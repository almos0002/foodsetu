import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'info' | 'success' | 'warning' | 'error'

const TONES: Record<Tone, { wrap: string; icon: typeof Info }> = {
  info: {
    wrap: 'border-[var(--color-sky)] bg-[var(--color-sky-soft)] text-[var(--color-sky-ink)]',
    icon: Info,
  },
  success: {
    wrap: 'border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)]',
    icon: CheckCircle2,
  },
  warning: {
    wrap: 'border-[var(--color-sun)] bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)]',
    icon: AlertTriangle,
  },
  error: {
    wrap: 'border-[var(--color-coral)] bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)]',
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
        'flex items-start gap-2.5 rounded-2xl border-[1.5px] px-4 py-3 text-sm',
        cfg.wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <div className="font-bold">{title}</div> : null}
        {children ? (
          <div className={cn(title && 'mt-0.5')}>{children}</div>
        ) : null}
      </div>
    </div>
  )
}
