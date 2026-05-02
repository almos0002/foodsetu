import { StatusBadge } from '../ui/StatusBadge'
import type { BadgeTone } from '../ui/StatusBadge'

type Props = {
  label: string
  tone?: BadgeTone
  className?: string
}

/**
 * Thin wrapper around the shared {@link StatusBadge} so admin tables get the
 * same minimal Linear/Vercel-style chip (small radius, neutral surface, single
 * coloured dot) as the rest of the app.
 */
export function StatusPill({ label, tone = 'gray', className }: Props) {
  return (
    <StatusBadge tone={tone} size="sm" className={className}>
      {label}
    </StatusBadge>
  )
}
