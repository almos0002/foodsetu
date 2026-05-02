import type { ReactNode } from 'react'
import { cn } from './cn'

export type BadgeTone =
  | 'gray'
  | 'orange'
  | 'green'
  | 'blue'
  | 'amber'
  | 'red'
  | 'purple'
  | 'indigo'
  | 'teal'

const TONES: Record<BadgeTone, string> = {
  gray: 'bg-[var(--color-cream)] text-[var(--color-ink-2)] border-[var(--color-line-strong)]',
  orange:
    'bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)] border-[var(--color-coral)]',
  green:
    'bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)] border-[var(--color-mint)]',
  blue: 'bg-[var(--color-sky-soft)] text-[var(--color-sky-ink)] border-[var(--color-sky)]',
  amber:
    'bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)] border-[var(--color-sun)]',
  red: 'bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)] border-[var(--color-coral)]',
  purple:
    'bg-[var(--color-berry-soft)] text-[var(--color-berry-ink)] border-[var(--color-berry)]',
  indigo:
    'bg-[var(--color-berry-soft)] text-[var(--color-berry-ink)] border-[var(--color-berry)]',
  teal: 'bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)] border-[var(--color-mint)]',
}

type Props = {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
  size?: 'sm' | 'md'
}

export function StatusBadge({
  tone = 'gray',
  icon,
  children,
  className,
  size = 'md',
}: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-[1.5px] font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
