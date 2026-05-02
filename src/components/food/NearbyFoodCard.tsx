import {
  CalendarClock,
  Clock,
  MapPin,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import type { NearbyListing } from '../../lib/claim-server'
import { FOOD_TYPE_LABELS, type FoodType } from '../../lib/permissions'

export function NearbyFoodCard({
  listing,
  busy,
  disabled,
  onClaim,
}: {
  listing: NearbyListing
  busy: boolean
  disabled: boolean
  onClaim: () => void
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {listing.imageUrl ? (
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 text-orange-300">
          <Utensils className="h-10 w-10" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {listing.title}
          </h3>
          {listing.restaurantName ? (
            <div className="text-xs text-gray-500">
              {listing.restaurantName}
              {listing.cityName ? ` · ${listing.cityName}` : ''}
            </div>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          <Field
            icon={<Utensils className="h-3.5 w-3.5" />}
            label="Quantity"
            value={`${listing.quantity} ${listing.quantityUnit}`}
          />
          <Field
            icon={<Utensils className="h-3.5 w-3.5" />}
            label="Type"
            value={
              FOOD_TYPE_LABELS[listing.foodType as FoodType] ?? listing.foodType
            }
          />
          <Field
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            label="Pickup"
            value={
              <>
                {formatTime(listing.pickupStartTime)}
                <br />
                <span className="text-gray-500">
                  → {formatTime(listing.pickupEndTime)}
                </span>
              </>
            }
          />
          <Field
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Expires"
            value={formatTime(listing.expiryTime)}
          />
          <Field
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Distance"
            value={
              listing.distanceKm != null
                ? formatDistance(listing.distanceKm)
                : 'Unknown'
            }
          />
          <Field
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Area"
            value={
              listing.restaurantAddress?.trim() ||
              listing.cityName ||
              `${listing.latitude.toFixed(4)}, ${listing.longitude.toFixed(4)}`
            }
          />
        </dl>

        <button
          type="button"
          onClick={onClaim}
          disabled={busy || disabled}
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <ShoppingBag className="h-4 w-4" />
          {busy ? 'Claiming…' : 'Claim'}
        </button>
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
    <div className="rounded-lg bg-gray-50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xs text-gray-900">{value}</div>
    </div>
  )
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatDistanceLong(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`
  if (km < 10) return `${km.toFixed(1)} km away`
  return `${Math.round(km)} km away`
}
