import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Props = {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  /** When true, drops the surrounding border for cases where the parent already has a card. */
  bare?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  bare = false,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        !bare &&
          'squircle border border-dashed border-[var(--color-line-strong)] bg-[var(--color-canvas-2)]',
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-10 w-10 items-center justify-center squircle border border-[var(--color-line)] bg-[var(--color-canvas)] text-[var(--color-ink-2)]">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
          {title}
        </h3>
        {description ? (
          <div className="mx-auto max-w-md text-sm text-[var(--color-ink-2)]">
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
