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
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
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
        'inline-flex items-center gap-1 rounded-full font-medium ring-1',
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
