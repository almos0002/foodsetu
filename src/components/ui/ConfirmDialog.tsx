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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-ink)]/55 p-0 sm:items-center sm:p-4"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border-[1.5px] border-[var(--color-line-strong)] bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b-[1.5px] border-dashed border-[var(--color-line)] p-5">
          <div
            className={cn(
              'flex h-11 w-11 -rotate-3 flex-shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)]',
              destructive
                ? 'bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)]'
                : 'bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)]',
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="font-display text-lg font-bold tracking-tight text-[var(--color-ink)]"
            >
              {title}
            </h2>
            {description ? (
              <div className="mt-1 text-sm text-[var(--color-ink-2)]">
                {description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!busy) onCancel()
            }}
            disabled={busy}
            aria-label="Close"
            className="rounded-full p-1.5 text-[var(--color-ink-3)] hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)] disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
