import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from './cn'

type ToastTone = 'success' | 'error' | 'info' | 'warning'

type Toast = {
  id: string
  tone: ToastTone
  title?: string
  message: string
  duration: number
}

type ToastContextValue = {
  show: (input: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }
  return ctx
}

const TONE_STYLES: Record<
  ToastTone,
  { wrap: string; icon: typeof CheckCircle2; iconColor: string }
> = {
  success: {
    wrap: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  error: {
    wrap: 'border-red-200 bg-red-50 text-red-900',
    icon: XCircle,
    iconColor: 'text-red-600',
  },
  info: {
    wrap: 'border-blue-200 bg-blue-50 text-blue-900',
    icon: Info,
    iconColor: 'text-blue-600',
  },
  warning: {
    wrap: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback<ToastContextValue['show']>(
    ({ tone, title, message, duration }) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      const next: Toast = {
        id,
        tone,
        title,
        message,
        duration: duration ?? (tone === 'error' ? 6000 : 4000),
      }
      setToasts((prev) => [...prev, next])
    },
    [],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      dismiss,
      success: (message, title) => show({ tone: 'success', message, title }),
      error: (message, title) => show({ tone: 'error', message, title }),
      info: (message, title) => show({ tone: 'info', message, title }),
      warning: (message, title) => show({ tone: 'warning', message, title }),
    }),
    [show, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const cfg = TONE_STYLES[toast.tone]
  const Icon = cfg.icon

  useEffect(() => {
    if (toast.duration <= 0) return
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => window.clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-start gap-2.5 squircle border px-4 py-3 text-sm',
        cfg.wrap,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', cfg.iconColor)} />
      <div className="min-w-0 flex-1">
        {toast.title ? (
          <div className="font-semibold leading-tight">{toast.title}</div>
        ) : null}
        <div className={cn(toast.title && 'mt-0.5', 'leading-snug')}>
          {toast.message}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="-mr-1 squircle p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
