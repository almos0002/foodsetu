import {
  CLAIM_STATUS_LABELS,
  LISTING_STATUS_LABELS,
} from '../../lib/permissions'
import type { ClaimStatus, ListingStatus } from '../../lib/permissions'
import { StatusBadge } from './StatusBadge'
import type { BadgeTone } from './StatusBadge'

const CLAIM_TONE: Record<ClaimStatus, BadgeTone> = {
  PENDING: 'amber',
  ACCEPTED: 'blue',
  REJECTED: 'red',
  CANCELLED: 'gray',
  PICKED_UP: 'purple',
  COMPLETED: 'green',
}

type ClaimProps = {
  status: ClaimStatus | string
  /** Kept for back-compat; icons are no longer rendered. */
  withIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function ClaimStatusBadge({
  status,
  size = 'md',
  className,
}: ClaimProps) {
  const s = status as ClaimStatus
  return (
    <StatusBadge
      tone={CLAIM_TONE[s] ?? 'gray'}
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

export function ListingStatusBadge({
  status,
  size = 'md',
  className,
}: ListingProps) {
  const s = status as ListingStatus
  return (
    <StatusBadge
      tone={LISTING_TONE[s] ?? 'gray'}
      size={size}
      className={className}
    >
      {LISTING_STATUS_LABELS[s] ?? status}
    </StatusBadge>
  )
}
