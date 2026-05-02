import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-gray-200 bg-white', className)}
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
        'flex flex-col gap-1 border-b border-gray-100 px-4 py-3 sm:px-5 sm:py-4',
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
    <h2 className={cn('text-sm font-semibold text-gray-900', className)}>
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
  return <p className={cn('text-xs text-gray-500', className)}>{children}</p>
}

export function CardBody({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('px-4 py-4 sm:px-5 sm:py-5', className)}>{children}</div>
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
        'flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/50 px-4 py-3 sm:px-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
