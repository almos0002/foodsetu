import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * Flat page-header in the Linear / Vercel mold:
 *   eyebrow · title · subtitle · meta-chips · actions
 *
 * No card surface, no decorative image, no tone color floods. The legacy
 * `tone` and `image` props are accepted-and-ignored for backwards
 * compatibility with existing dashboard callsites.
 */
type Tone = 'orange' | 'rose' | 'emerald' | 'gray'

type Props = {
  eyebrow: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  /** Accepted for backwards-compat; ignored visually. */
  image?: string
  /** Small meta chips rendered between title and actions. */
  chips?: Array<{ label: string; icon?: ReactNode }>
  /** Accepted for backwards-compat; ignored visually. */
  tone?: Tone
  className?: string
}

export function DashboardWelcomeBanner({
  eyebrow,
  title,
  description,
  actions,
  chips,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="tiny-cap text-[var(--color-ink-3)]">{eyebrow}</div>
        <h1 className="font-display mt-1.5 break-words text-[24px] font-semibold leading-tight tracking-tight text-[var(--color-ink)] sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--color-ink-2)]">
            {description}
          </p>
        ) : null}
        {chips && chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-canvas-2)] px-2 py-1 text-[11px] font-medium text-[var(--color-ink-2)]"
              >
                {chip.icon}
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
