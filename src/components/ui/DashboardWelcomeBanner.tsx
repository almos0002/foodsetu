import type { ReactNode } from 'react'
import { cn } from './cn'

type Tone = 'orange' | 'rose' | 'emerald' | 'gray'

const TONES: Record<
  Tone,
  { bg: string; eyebrow: string; ring: string; chip: string }
> = {
  orange: {
    bg: 'bg-orange-50',
    eyebrow: 'text-orange-700',
    ring: 'ring-orange-100',
    chip: 'bg-white text-orange-700',
  },
  rose: {
    bg: 'bg-rose-50',
    eyebrow: 'text-rose-700',
    ring: 'ring-rose-100',
    chip: 'bg-white text-rose-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    eyebrow: 'text-emerald-700',
    ring: 'ring-emerald-100',
    chip: 'bg-white text-emerald-700',
  },
  gray: {
    bg: 'bg-gray-900',
    eyebrow: 'text-orange-300',
    ring: 'ring-gray-700',
    chip: 'bg-white/10 text-white',
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
  const dark = tone === 'gray'
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-200',
        t.bg,
        dark && 'border-gray-800',
        className,
      )}
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="p-6 sm:p-8">
          <div
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wider',
              t.eyebrow,
            )}
          >
            {eyebrow}
          </div>
          <h1
            className={cn(
              'mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]',
              dark ? 'text-white' : 'text-gray-900',
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cn(
                'mt-2 max-w-xl text-sm sm:text-base',
                dark ? 'text-gray-300' : 'text-gray-600',
              )}
            >
              {description}
            </p>
          ) : null}
          {chips && chips.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1',
                    t.chip,
                    t.ring,
                  )}
                >
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
          {actions ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
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
