import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'info' | 'success' | 'warning' | 'error'

const TONES: Record<Tone, { wrap: string; icon: typeof Info }> = {
  info: { wrap: 'border-blue-200 bg-blue-50 text-blue-900', icon: Info },
  success: {
    wrap: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
  },
  warning: {
    wrap: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: AlertTriangle,
  },
  error: { wrap: 'border-red-200 bg-red-50 text-red-900', icon: XCircle },
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
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        cfg.wrap,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        {children ? (
          <div className={cn(title && 'mt-0.5')}>{children}</div>
        ) : null}
      </div>
    </div>
  )
}
