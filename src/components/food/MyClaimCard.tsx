import { Link } from '@tanstack/react-router'
import {
  CalendarClock,
  CheckCircle2,
  Flag,
  KeyRound,
  MapPin,
  Phone,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { MyClaim } from '../../lib/claim-server'
import { FOOD_TYPE_LABELS } from '../../lib/permissions'
import type { ClaimStatus, FoodType } from '../../lib/permissions'
import { ClaimStatusBadge } from '../ui/ClaimStatusBadge'
import { formatTime } from '../ui/FoodListingCard'

export function MyClaimCard({ claim }: { claim: MyClaim }) {
  const status = claim.status as ClaimStatus
  const l = claim.listing
  return (
    <article className="overflow-hidden rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-[1.5px] border-dashed border-[var(--color-line)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-lg font-bold tracking-tight text-[var(--color-ink)]">
            {l.title}
          </h3>
          <div className="text-xs text-[var(--color-ink-2)]">
            {l.restaurantName ?? 'Restaurant'}
            {l.cityName ? ` · ${l.cityName}` : ''}
            {' · claimed '}
            {formatTime(claim.createdAt)}
          </div>
        </div>
        <ClaimStatusBadge status={status} size="sm" />
      </div>

      <div className="grid gap-2 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <span className="text-[var(--color-ink-2)]">
                → {formatTime(l.pickupEndTime)}
              </span>
            </>
          }
        />
        <Field
          icon={<MapPin className="h-3 w-3" />}
          label="Address"
          value={
            l.restaurantAddress?.trim() ||
            l.cityName ||
            `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}`
          }
        />
        {l.restaurantPhone ? (
          <Field
            icon={<Phone className="h-3 w-3" />}
            label="Restaurant phone"
            value={
              <a
                href={`tel:${l.restaurantPhone}`}
                className="font-bold text-[var(--color-coral)] hover:underline"
              >
                {l.restaurantPhone}
              </a>
            }
          />
        ) : null}
      </div>

      {status === 'PENDING' ? (
        <div className="border-t-[1.5px] border-dashed border-[var(--color-line)] bg-[var(--color-sun-soft)] px-5 py-3 text-xs font-medium text-[var(--color-sun-ink)]">
          <ShoppingBag className="mr-1 inline h-3 w-3" />
          Waiting for the restaurant to accept your claim.
        </div>
      ) : null}
      {status === 'ACCEPTED' ? (
        <div className="border-t-[1.5px] border-dashed border-[var(--color-line)] bg-[var(--color-sky-soft)] px-5 py-4 text-xs text-[var(--color-sky-ink)]">
          <div className="mb-2 font-medium">
            The restaurant accepted — head over during the pickup window.
          </div>
          {claim.otpCode ? (
            <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-[var(--color-sky)] bg-white p-4">
              <KeyRound className="h-6 w-6 text-[var(--color-sky-ink)]" />
              <div className="flex-1">
                <div className="tiny-cap text-[var(--color-sky-ink)]">
                  Pickup OTP — show this to the restaurant
                </div>
                <div className="font-display mt-1 text-2xl font-bold tracking-[0.3em] tabular-nums text-[var(--color-ink)]">
                  {claim.otpCode}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {status === 'PICKED_UP' && claim.otpCode ? (
        <div className="border-t-[1.5px] border-dashed border-[var(--color-line)] bg-[var(--color-mint-soft)] px-5 py-3 text-xs font-medium text-[var(--color-mint-ink)]">
          <KeyRound className="mr-1 inline h-3 w-3" />
          Pickup confirmed (OTP{' '}
          <span className="font-mono font-bold">{claim.otpCode}</span>).
        </div>
      ) : null}
      {status === 'COMPLETED' ? (
        <div className="border-t-[1.5px] border-dashed border-[var(--color-line)] bg-[var(--color-mint-soft)] px-5 py-3 text-xs text-[var(--color-mint-ink)]">
          <div className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            Pickup verified — thank you for collecting this donation.
          </div>
          {claim.otpCode ? (
            <div className="mt-1">
              OTP used:{' '}
              <span className="font-mono font-bold">{claim.otpCode}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {status === 'REJECTED' ? (
        <div className="border-t-[1.5px] border-dashed border-[var(--color-line)] bg-[var(--color-coral-soft)] px-5 py-3 text-xs font-medium text-[var(--color-coral-ink)]">
          The restaurant declined this claim.
        </div>
      ) : null}

      <div className="flex items-center justify-end border-t-[1.5px] border-dashed border-[var(--color-line)] bg-[var(--color-cream)] px-5 py-3">
        <Link
          to="/reports/new"
          search={{ listingId: l.id, claimId: claim.id }}
          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-coral)] hover:underline"
        >
          <Flag className="h-3 w-3" />
          Report a problem
        </Link>
      </div>
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
    <div className="rounded-2xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-cream)] px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-2)]">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xs font-semibold text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  )
}
