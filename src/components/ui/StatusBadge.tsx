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

/**
 * In the minimal palette we no longer rely on saturated chips for each tone.
 * Most badges share a neutral surface and are differentiated by a coloured
 * dot/text. The "loud" tones (success/warn/info/danger) keep a soft tinted
 * background since the colour itself carries meaning.
 */
const TONES: Record<BadgeTone, string> = {
  gray:
    'bg-[var(--color-canvas-2)] text-[var(--color-ink-2)] border-[var(--color-line)]',
  orange:
    'bg-[var(--color-canvas-2)] text-[var(--color-ink)] border-[var(--color-line)]',
  green:
    'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] border-[var(--color-accent)]/25',
  blue:
    'bg-[var(--color-info-soft)] text-[var(--color-info-ink)] border-[var(--color-info)]/25',
  amber:
    'bg-[var(--color-warn-soft)] text-[var(--color-warn-ink)] border-[var(--color-warn)]/25',
  red:
    'bg-[var(--color-danger-soft)] text-[var(--color-danger-ink)] border-[var(--color-danger)]/25',
  purple:
    'bg-[var(--color-purple-soft)] text-[var(--color-purple-ink)] border-[var(--color-purple)]/25',
  indigo:
    'bg-[var(--color-purple-soft)] text-[var(--color-purple-ink)] border-[var(--color-purple)]/25',
  teal:
    'bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)] border-[var(--color-accent)]/25',
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
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
