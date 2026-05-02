import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border-[1.5px] border-[var(--color-line)] bg-white',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-b-[1.5px] border-dashed border-[var(--color-line)] px-5 py-4 sm:px-6 sm:py-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <h2
      className={cn(
        'font-display text-base font-bold tracking-tight text-[var(--color-ink)]',
        className,
      )}
    >
      {children}
    </h2>
  )
}

export function CardDescription({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <p className={cn('text-xs text-[var(--color-ink-2)]', className)}>
      {children}
    </p>
  )
}

export function CardBody({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('px-5 py-5 sm:px-6 sm:py-6', className)}>{children}</div>
  )
}

export function CardFooter({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t-[1.5px] border-dashed border-[var(--color-line)] bg-[var(--color-cream)] px-5 py-4 sm:px-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
