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
    <div className={cn('mb-6 space-y-3', className)}>
      {back ? (
        <Link
          to={back.to}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="tiny-cap text-[var(--color-ink-3)]">{eyebrow}</div>
          ) : null}
          <h1 className="font-display mt-1 text-[26px] font-semibold tracking-tight text-[var(--color-ink)] sm:text-[28px]">
            {title}
          </h1>
          {description ? (
            <div className="mt-1.5 text-sm text-[var(--color-ink-2)]">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
