import {
  CalendarClock,
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
        <div className="border-t border-gray-100 bg-blue-50/50 px-4 py-2 text-xs text-blue-900">
          The restaurant accepted — head over during the pickup window.
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
