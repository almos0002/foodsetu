import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type BackLink = {
  to: string
  label: string
}

type Props = {
  title: string
  description?: ReactNode
  /** Optional small label above the title (eyebrow). */
  eyebrow?: ReactNode
  actions?: ReactNode
  back?: BackLink
  className?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  back,
  className,
}: Props) {
  return (
    <div className={cn('mb-5 space-y-3', className)}>
      {back ? (
        <Link
          to={back.to}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <div className="mt-1 text-sm text-gray-500">{description}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
