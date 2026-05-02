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
        'flex items-center justify-center gap-2 px-6 py-10 text-sm text-gray-500',
        !bare && 'rounded-lg border border-gray-200 bg-white',
        className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
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
      className={cn('animate-pulse rounded-md bg-gray-100', className)}
    />
  )
}
