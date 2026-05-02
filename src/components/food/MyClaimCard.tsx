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
import type { MyClaim } from '../../lib/claim-server'
import {
  CLAIM_STATUS_BADGE_CLASSES,
  CLAIM_STATUS_LABELS,
  FOOD_TYPE_LABELS,
  type ClaimStatus,
  type FoodType,
} from '../../lib/permissions'
import { formatTime } from './NearbyFoodCard'

export function MyClaimCard({ claim }: { claim: MyClaim }) {
  const status = claim.status as ClaimStatus
  const l = claim.listing
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {l.title}
          </h3>
          <div className="text-xs text-gray-500">
            {l.restaurantName ?? 'Restaurant'}
            {l.cityName ? ` · ${l.cityName}` : ''}
            {' · claimed '}
            {new Date(claim.createdAt).toLocaleString()}
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${CLAIM_STATUS_BADGE_CLASSES[status] ?? ''}`}
        >
          {CLAIM_STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          icon={<Utensils className="h-3.5 w-3.5" />}
          label="Quantity"
          value={`${l.quantity} ${l.quantityUnit}`}
        />
        <Field
          icon={<Utensils className="h-3.5 w-3.5" />}
          label="Food type"
          value={FOOD_TYPE_LABELS[l.foodType as FoodType] ?? l.foodType}
        />
        <Field
          icon={<CalendarClock className="h-3.5 w-3.5" />}
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
        <Field
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Address"
          value={
            l.restaurantAddress?.trim() ||
            l.cityName ||
            `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}`
          }
        />
        {l.restaurantPhone ? (
          <Field
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Restaurant phone"
            value={
              <a
                href={`tel:${l.restaurantPhone}`}
                className="text-orange-600 hover:text-orange-700"
              >
                {l.restaurantPhone}
              </a>
            }
          />
        ) : null}
      </div>

      {status === 'PENDING' ? (
        <div className="border-t border-gray-100 bg-amber-50/50 px-4 py-2 text-xs text-amber-900">
          <ShoppingBag className="mr-1 inline h-3.5 w-3.5" />
          Waiting for the restaurant to accept your claim.
        </div>
      ) : null}
      {status === 'ACCEPTED' ? (
        <div className="border-t border-gray-100 bg-blue-50/50 px-4 py-3 text-xs text-blue-900">
          <div className="mb-2">
            The restaurant accepted — head over during the pickup window.
          </div>
          {claim.otpCode ? (
            <div className="flex items-center gap-2 rounded-lg bg-white p-3 ring-1 ring-blue-200">
              <KeyRound className="h-5 w-5 text-blue-700" />
              <div className="flex-1">
                <div className="text-[10px] font-medium uppercase tracking-wide text-blue-700">
                  Pickup OTP — show this to the restaurant
                </div>
                <div className="mt-0.5 font-mono text-lg font-semibold tracking-[0.3em] text-gray-900">
                  {claim.otpCode}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {status === 'PICKED_UP' && claim.otpCode ? (
        <div className="border-t border-gray-100 bg-emerald-50/50 px-4 py-2 text-xs text-emerald-900">
          <KeyRound className="mr-1 inline h-3.5 w-3.5" />
          Pickup confirmed (OTP{' '}
          <span className="font-mono font-semibold">{claim.otpCode}</span>).
        </div>
      ) : null}
      {status === 'COMPLETED' ? (
        <div className="border-t border-gray-100 bg-emerald-50/50 px-4 py-3 text-xs text-emerald-900">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Pickup verified — thank you for collecting this donation.
          </div>
          {claim.otpCode ? (
            <div className="mt-1 text-emerald-800/80">
              OTP used:{' '}
              <span className="font-mono font-semibold">{claim.otpCode}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {status === 'REJECTED' ? (
        <div className="border-t border-gray-100 bg-red-50/50 px-4 py-2 text-xs text-red-900">
          The restaurant declined this claim.
        </div>
      ) : null}

      <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50 px-4 py-2">
        <Link
          to="/reports/new"
          search={{ listingId: l.id, claimId: claim.id }}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700"
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
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xs text-gray-900">{value}</div>
    </div>
  )
}
