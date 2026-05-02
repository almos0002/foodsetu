import { Loader2 } from 'lucide-react'
import { cn } from './cn'

type Props = {
  label?: string
  className?: string
  /** When true, drops the bordered card so the spinner can be inline. */
  bare?: boolean
}

export function LoadingState({ label = 'Loading…', className, bare }: Props) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-12 text-sm font-medium text-[var(--color-ink-2)]',
        !bare &&
          'rounded-3xl border-[1.5px] border-[var(--color-line)] bg-white',
        className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-[var(--color-coral)]" />
      <span>{label}</span>
    </div>
  )
}

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-[var(--color-cream)]',
        className,
      )}
    />
  )
}
