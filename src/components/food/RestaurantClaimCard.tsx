import { Link } from '@tanstack/react-router'
import {
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  MapPin,
  Phone,
  ShieldCheck,
  Utensils,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { RestaurantClaim } from '../../lib/claim-server'
import {
  FOOD_TYPE_LABELS,
  type ClaimStatus,
  type FoodType,
} from '../../lib/permissions'
import { Button } from '../ui/Button'
import { ClaimStatusBadge } from '../ui/ClaimStatusBadge'
import { formatTime } from '../ui/FoodListingCard'

const CLAIMANT_ORG_TYPE_LABELS: Record<string, string> = {
  NGO: 'NGO',
  ANIMAL_RESCUE: 'Animal rescue',
  RESTAURANT: 'Restaurant',
}

export function RestaurantClaimCard({
  claim,
  busy,
  disabled,
  onAccept,
  onReject,
  showActions = true,
}: {
  claim: RestaurantClaim
  busy?: 'accept' | 'reject' | null
  disabled?: boolean
  onAccept?: () => void
  onReject?: () => void
  showActions?: boolean
}) {
  const status = claim.status as ClaimStatus
  const isPending = status === 'PENDING'
  const c = claim.claimant
  const l = claim.listing

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {l.title}
          </h3>
          <div className="text-xs text-gray-500">
            Requested {formatTime(claim.createdAt)}
            {l.cityName ? ` · ${l.cityName}` : ''}
          </div>
        </div>
        <ClaimStatusBadge status={status} size="sm" />
      </div>

      <div className="grid gap-2 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          icon={<Building2 className="h-3 w-3" />}
          label="Claimant"
          value={
            <>
              <div className="font-medium text-gray-900">
                {c.orgName ?? '—'}
              </div>
              <div className="text-[11px] text-gray-500">
                {(c.orgType && CLAIMANT_ORG_TYPE_LABELS[c.orgType]) ??
                  c.orgType ??
                  ''}
                {c.cityName ? ` · ${c.cityName}` : ''}
              </div>
            </>
          }
        />
        {c.orgPhone ? (
          <Field
            icon={<Phone className="h-3 w-3" />}
            label="Phone"
            value={
              <a
                href={`tel:${c.orgPhone}`}
                className="text-orange-600 hover:text-orange-700"
              >
                {c.orgPhone}
              </a>
            }
          />
        ) : null}
        {c.orgAddress?.trim() ? (
          <Field
            icon={<MapPin className="h-3 w-3" />}
            label="Address"
            value={c.orgAddress}
          />
        ) : null}
        <Field
          icon={<Utensils className="h-3 w-3" />}
          label="Quantity"
          value={`${l.quantity} ${l.quantityUnit}`}
        />
        <Field
          icon={<Utensils className="h-3 w-3" />}
          label="Food type"
          value={FOOD_TYPE_LABELS[l.foodType as FoodType] ?? l.foodType}
        />
        <Field
          icon={<CalendarClock className="h-3 w-3" />}
          label="Pickup window"
          value={
            <>
              {formatTime(l.pickupStartTime)}
              <br />
              <span className="text-gray-500">
                → {formatTime(l.pickupEndTime)}
              </span>
            </>
          }
        />
      </div>

      {claim.otpIssued && status === 'ACCEPTED' ? (
        <div className="border-t border-gray-100 bg-blue-50/60 px-4 py-2 text-xs text-blue-900">
          <KeyRound className="mr-1 inline h-3 w-3" />
          OTP issued — open this claim to enter the 6-digit code at pickup.
        </div>
      ) : null}
      {status === 'PICKED_UP' ? (
        <div className="border-t border-gray-100 bg-emerald-50/60 px-4 py-2 text-xs text-emerald-900">
          Pickup confirmed.
        </div>
      ) : null}
      {status === 'COMPLETED' ? (
        <div className="border-t border-gray-100 bg-emerald-50/60 px-4 py-2 text-xs text-emerald-900">
          <CheckCircle2 className="mr-1 inline h-3 w-3" />
          Pickup verified — handoff complete.
        </div>
      ) : null}

      {showActions ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          <Link
            to="/restaurant/claims/$id"
            params={{ id: claim.id }}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
          >
            View details
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          {status === 'ACCEPTED' ? (
            <Link to="/restaurant/claims/$id" params={{ id: claim.id }}>
              <Button size="sm" leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}>
                Verify pickup
              </Button>
            </Link>
          ) : null}
          {isPending && onReject ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={onReject}
              disabled={disabled || busy != null}
              leftIcon={<X className="h-3.5 w-3.5" />}
            >
              {busy === 'reject' ? 'Rejecting…' : 'Reject'}
            </Button>
          ) : null}
          {isPending && onAccept ? (
            <Button
              size="sm"
              onClick={onAccept}
              disabled={disabled || busy != null}
              leftIcon={<Check className="h-3.5 w-3.5" />}
            >
              {busy === 'accept' ? 'Accepting…' : 'Accept'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function Field({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xs text-gray-900">{value}</div>
    </div>
  )
}
