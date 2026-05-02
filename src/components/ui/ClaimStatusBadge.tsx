import {
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import type { ReactNode } from 'react'
import {
  CLAIM_STATUS_LABELS,
  LISTING_STATUS_LABELS,
  type ClaimStatus,
  type ListingStatus,
} from '../../lib/permissions'
import { StatusBadge, type BadgeTone } from './StatusBadge'

const CLAIM_TONE: Record<ClaimStatus, BadgeTone> = {
  PENDING: 'amber',
  ACCEPTED: 'blue',
  REJECTED: 'red',
  CANCELLED: 'gray',
  PICKED_UP: 'purple',
  COMPLETED: 'green',
}

const CLAIM_ICON: Record<ClaimStatus, ReactNode> = {
  PENDING: <Clock className="h-3 w-3" />,
  ACCEPTED: <CheckCircle2 className="h-3 w-3" />,
  REJECTED: <XCircle className="h-3 w-3" />,
  CANCELLED: <XCircle className="h-3 w-3" />,
  PICKED_UP: <Truck className="h-3 w-3" />,
  COMPLETED: <PackageCheck className="h-3 w-3" />,
}

type ClaimProps = {
  status: ClaimStatus | string
  withIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ClaimStatusBadge({
  status,
  withIcon = true,
  size = 'md',
  className,
}: ClaimProps) {
  const s = status as ClaimStatus
  return (
    <StatusBadge
      tone={CLAIM_TONE[s] ?? 'gray'}
      icon={withIcon ? CLAIM_ICON[s] : undefined}
      size={size}
      className={className}
    >
      {CLAIM_STATUS_LABELS[s] ?? status}
    </StatusBadge>
  )
}

const LISTING_TONE: Record<ListingStatus, BadgeTone> = {
  DRAFT: 'gray',
  AVAILABLE: 'green',
  CLAIM_REQUESTED: 'blue',
  CLAIMED: 'indigo',
  PICKED_UP: 'purple',
  EXPIRED: 'amber',
  CANCELLED: 'gray',
  REPORTED: 'red',
}

type ListingProps = {
  status: ListingStatus | string
  size?: 'sm' | 'md'
  className?: string
}

export function ListingStatusBadge({ status, size = 'md', className }: ListingProps) {
  const s = status as ListingStatus
  return (
    <StatusBadge tone={LISTING_TONE[s] ?? 'gray'} size={size} className={className}>
      {LISTING_STATUS_LABELS[s] ?? status}
    </StatusBadge>
  )
}
