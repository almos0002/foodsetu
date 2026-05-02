import { Building2, PawPrint, ShieldCheck, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import { ROLE_LABELS, type Role } from '../../lib/permissions'
import { StatusBadge, type BadgeTone } from './StatusBadge'

const ROLE_TONE: Record<Role, BadgeTone> = {
  ADMIN: 'purple',
  RESTAURANT: 'orange',
  NGO: 'blue',
  ANIMAL_RESCUE: 'teal',
}

const ROLE_ICON: Record<Role, ReactNode> = {
  ADMIN: <ShieldCheck className="h-3 w-3" />,
  RESTAURANT: <Utensils className="h-3 w-3" />,
  NGO: <Building2 className="h-3 w-3" />,
  ANIMAL_RESCUE: <PawPrint className="h-3 w-3" />,
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
  withIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function RoleBadge({
  role,
  short = true,
  withIcon = true,
  size = 'sm',
  className,
}: Props) {
  if (!role) {
    return (
      <StatusBadge tone="gray" size={size} className={className}>
        —
      </StatusBadge>
    )
  }
  const r = role as Role
  const label = short ? (SHORT_ROLE_LABELS[r] ?? role) : (ROLE_LABELS[r] ?? role)
  return (
    <StatusBadge
      tone={ROLE_TONE[r] ?? 'gray'}
      icon={withIcon ? ROLE_ICON[r] : undefined}
      size={size}
      className={className}
    >
      {label}
    </StatusBadge>
  )
}
