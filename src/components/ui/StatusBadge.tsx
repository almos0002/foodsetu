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

const DOT_COLOR: Record<BadgeTone, string> = {
  gray: 'var(--color-ink-3)',
  orange: 'var(--color-warn)',
  green: 'var(--color-accent)',
  blue: 'var(--color-info)',
  amber: 'var(--color-warn)',
  red: 'var(--color-danger)',
  purple: 'var(--color-purple)',
  indigo: 'var(--color-purple)',
  teal: 'var(--color-accent)',
}

type Props = {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
  size?: 'sm' | 'md'
  /** Show the colored dot indicator. Default true. */
  withDot?: boolean
}

export function StatusBadge({
  tone = 'gray',
  icon,
  children,
  className,
  size = 'md',
  withDot = true,
}: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 squircle border border-[var(--color-line)] bg-[var(--color-canvas)] font-medium text-[var(--color-ink-2)]',
        size === 'sm'
          ? 'px-1.5 py-px text-[10.5px] leading-[16px]'
          : 'px-2 py-0.5 text-[11px] leading-[18px]',
        className,
      )}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 squircle"
          style={{ backgroundColor: DOT_COLOR[tone] }}
        />
      ) : null}
      {icon}
      <span className="text-[var(--color-ink)]">{children}</span>
    </span>
  )
}
