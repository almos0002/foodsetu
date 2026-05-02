import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'orange' | 'rose' | 'emerald' | 'gray'

const TONES: Record<
  Tone,
  { bg: string; eyebrow: string; chip: string; titleColor: string; bodyColor: string; rotate: string }
> = {
  orange: {
    bg: 'bg-[var(--color-coral-soft)]',
    eyebrow: 'text-[var(--color-coral)]',
    chip: 'bg-white text-[var(--color-coral-ink)] border-[var(--color-coral)]',
    titleColor: 'text-[var(--color-ink)]',
    bodyColor: 'text-[var(--color-ink-2)]',
    rotate: '-rotate-1',
  },
  rose: {
    bg: 'bg-[var(--color-berry-soft)]',
    eyebrow: 'text-[var(--color-berry)]',
    chip: 'bg-white text-[var(--color-berry-ink)] border-[var(--color-berry)]',
    titleColor: 'text-[var(--color-ink)]',
    bodyColor: 'text-[var(--color-ink-2)]',
    rotate: 'rotate-1',
  },
  emerald: {
    bg: 'bg-[var(--color-mint-soft)]',
    eyebrow: 'text-[var(--color-mint-ink)]',
    chip: 'bg-white text-[var(--color-mint-ink)] border-[var(--color-mint)]',
    titleColor: 'text-[var(--color-ink)]',
    bodyColor: 'text-[var(--color-ink-2)]',
    rotate: '-rotate-1',
  },
  gray: {
    bg: 'bg-[var(--color-ink)]',
    eyebrow: 'text-[var(--color-sun)]',
    chip: 'bg-white/10 text-white border-white/20',
    titleColor: 'text-white',
    bodyColor: 'text-white/85',
    rotate: 'rotate-1',
  },
}

type Props = {
  eyebrow: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  /** Decorative photo URL shown on the right (hidden on mobile). */
  image?: string
  /** Decorative meta chips shown above actions, e.g. date, city, role. */
  chips?: Array<{ label: string; icon?: ReactNode }>
  tone?: Tone
  className?: string
}

export function DashboardWelcomeBanner({
  eyebrow,
  title,
  description,
  actions,
  image,
  chips,
  tone = 'orange',
  className,
}: Props) {
  const t = TONES[tone]
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[32px] border-[1.5px] border-[var(--color-line-strong)]',
        t.bg,
        className,
      )}
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="p-7 sm:p-9">
          <div className={cn('tiny-cap', t.eyebrow)}>{eyebrow}</div>
          <h1
            className={cn(
              'font-display mt-3 text-3xl font-bold tracking-tight sm:text-[36px]',
              t.titleColor,
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className={cn('mt-3 max-w-xl text-sm sm:text-base', t.bodyColor)}>
              {description}
            </p>
          ) : null}
          {chips && chips.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1 text-xs font-semibold',
                    t.chip,
                  )}
                >
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
          {actions ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
        {image ? (
          <div className="relative hidden lg:block">
            <img
              src={image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
