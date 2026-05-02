import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { cn } from './cn'

type Props = {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onCancel, busy])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-0 sm:items-center sm:p-4"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        className="w-full max-w-md rounded-t-xl border border-gray-200 bg-white sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-gray-100 p-4 sm:p-5">
          <div
            className={cn(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
              destructive
                ? 'bg-red-50 text-red-600'
                : 'bg-orange-50 text-orange-600',
            )}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-sm font-semibold text-gray-900"
            >
              {title}
            </h2>
            {description ? (
              <div className="mt-1 text-xs text-gray-600">{description}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!busy) onCancel()
            }}
            disabled={busy}
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end sm:p-5">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            onClick={onConfirm}
            disabled={busy}
            className={
              destructive
                ? 'bg-red-600 text-white border-transparent hover:bg-red-700'
                : ''
            }
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
