import {
  CalendarClock,
  Clock,
  MapPin,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { cn } from './cn'
import { ListingStatusBadge } from './ClaimStatusBadge'
import { FOOD_CATEGORY_LABELS, FOOD_TYPE_LABELS } from '../../lib/permissions'
import type { FoodCategory, FoodType } from '../../lib/permissions'

export type FoodListingCardData = {
  id: string
  title: string
  imageUrl?: string | null
  description?: string | null
  quantity: number
  quantityUnit: string
  foodCategory?: string | null
  foodType: string
  pickupStartTime: string
  pickupEndTime: string
  expiryTime: string
  status?: string | null
  restaurantName?: string | null
  restaurantAddress?: string | null
  cityName?: string | null
  distanceKm?: number | null
  latitude?: number | null
  longitude?: number | null
}

type Props = {
  listing: FoodListingCardData
  /** Renders a compact image preview at the top. Defaults to true. */
  showImage?: boolean
  /** Display the listing status badge in the header. */
  showStatus?: boolean
  /** Renders a primary action button (e.g. "Claim"). */
  action?: {
    label: string
    onClick: () => void
    busy?: boolean
    busyLabel?: string
    disabled?: boolean
    icon?: ReactNode
  }
  /** Optional secondary slot at footer (e.g. "Open" link). */
  footerSlot?: ReactNode
  className?: string
}

export function FoodListingCard({
  listing,
  showImage = true,
  showStatus = false,
  action,
  footerSlot,
  className,
}: Props) {
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white',
        className,
      )}
    >
      {showImage ? (
        listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-orange-50 text-orange-300">
            <Utensils className="h-8 w-8" />
          </div>
        )
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {listing.title}
            </h3>
            {listing.restaurantName || listing.cityName ? (
              <div className="mt-0.5 truncate text-xs text-gray-500">
                {listing.restaurantName ?? ''}
                {listing.restaurantName && listing.cityName ? ' · ' : ''}
                {listing.cityName ?? ''}
              </div>
            ) : null}
          </div>
          {showStatus && listing.status ? (
            <ListingStatusBadge status={listing.status} size="sm" />
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          <Field
            icon={<Utensils className="h-3 w-3" />}
            label="Quantity"
            value={`${listing.quantity} ${listing.quantityUnit}`}
          />
          <Field
            icon={<Utensils className="h-3 w-3" />}
            label="Type"
            value={
              FOOD_TYPE_LABELS[listing.foodType as FoodType] ?? listing.foodType
            }
          />
          <Field
            icon={<CalendarClock className="h-3 w-3" />}
            label="Pickup"
            value={
              <>
                <span className="block">
                  {formatTime(listing.pickupStartTime)}
                </span>
                <span className="block text-gray-500">
                  → {formatTime(listing.pickupEndTime)}
                </span>
              </>
            }
          />
          <Field
            icon={<Clock className="h-3 w-3" />}
            label="Expires"
            value={formatTime(listing.expiryTime)}
          />
          <Field
            icon={<MapPin className="h-3 w-3" />}
            label="Distance"
            value={
              listing.distanceKm != null
                ? formatDistance(listing.distanceKm)
                : '—'
            }
          />
          <Field
            icon={<MapPin className="h-3 w-3" />}
            label="Area"
            value={
              listing.restaurantAddress?.trim() ||
              listing.cityName ||
              (listing.latitude != null && listing.longitude != null
                ? `${listing.latitude.toFixed(3)}, ${listing.longitude.toFixed(3)}`
                : '—')
            }
          />
        </dl>

        {listing.foodCategory ? (
          <div className="text-[11px] text-gray-500">
            {FOOD_CATEGORY_LABELS[listing.foodCategory as FoodCategory] ??
              listing.foodCategory}
          </div>
        ) : null}

        {action ? (
          <Button
            onClick={action.onClick}
            disabled={action.disabled || action.busy}
            leftIcon={action.icon ?? <ShoppingBag className="h-4 w-4" />}
            fullWidth
            className="mt-auto"
          >
            {action.busy
              ? (action.busyLabel ?? `${action.label}…`)
              : action.label}
          </Button>
        ) : null}
        {footerSlot}
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
    <div className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5">
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
