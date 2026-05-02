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
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        !bare && 'rounded-lg border border-dashed border-gray-300 bg-white',
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description ? (
          <div className="mx-auto max-w-md text-xs text-gray-500">
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
