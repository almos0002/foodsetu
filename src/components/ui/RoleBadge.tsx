import { ROLE_LABELS } from '../../lib/permissions'
import type { Role } from '../../lib/permissions'
import { StatusBadge } from './StatusBadge'
import type { BadgeTone } from './StatusBadge'

const ROLE_TONE: Record<Role, BadgeTone> = {
  ADMIN: 'purple',
  RESTAURANT: 'orange',
  NGO: 'blue',
  ANIMAL_RESCUE: 'teal',
}

const SHORT_ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  RESTAURANT: 'Restaurant',
  NGO: 'NGO',
  ANIMAL_RESCUE: 'Animal rescue',
}

type Props = {
  role: Role | string | null | undefined
  /** Use short single-word labels rather than the long form. */
  short?: boolean
  /** Kept for back-compat; icons are no longer rendered. */
  withIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function RoleBadge({
  role,
  short = true,
  size = 'sm',
  className,
}: Props) {
  if (!role) {
    return (
      <StatusBadge tone="gray" size={size} className={className} withDot={false}>
        —
      </StatusBadge>
    )
  }
  const r = role as Role
  const label = short
    ? (SHORT_ROLE_LABELS[r] ?? role)
    : (ROLE_LABELS[r] ?? role)
  return (
    <StatusBadge
      tone={ROLE_TONE[r] ?? 'gray'}
      size={size}
      className={className}
    >
      {label}
    </StatusBadge>
  )
}
