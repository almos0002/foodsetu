import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Props = {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  /** When true, drops the dashed border for cases where the parent already has a card. */
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
        'flex flex-col items-center justify-center gap-4 px-6 py-14 text-center',
        !bare &&
          'rounded-3xl border-[1.5px] border-dashed border-[var(--color-line-strong)] bg-[var(--color-cream)]',
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-14 w-14 -rotate-3 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-white text-[var(--color-coral)]">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="font-display text-xl font-bold tracking-tight text-[var(--color-ink)]">
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
