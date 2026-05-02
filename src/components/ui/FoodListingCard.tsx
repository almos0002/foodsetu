import { MapPin, ShoppingBag, Utensils } from 'lucide-react'
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
  showImage?: boolean
  showStatus?: boolean
  action?: {
    label: string
    onClick: () => void
    busy?: boolean
    busyLabel?: string
    disabled?: boolean
    icon?: ReactNode
  }
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
  const isAnimal = listing.foodCategory === 'ANIMAL_SAFE'
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] transition-colors hover:border-[var(--color-line-strong)]',
        className,
      )}
    >
      {showImage ? (
        listing.imageUrl ? (
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--color-canvas-3)]">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
            {listing.foodCategory ? (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-canvas)] px-2 py-1 text-[11px] font-medium text-[var(--color-ink)]">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    isAnimal
                      ? 'bg-[var(--color-warn)]'
                      : 'bg-[var(--color-accent)]',
                  )}
                />
                {isAnimal ? 'Animal-safe' : 'Human-safe'}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="flex h-32 w-full items-center justify-center bg-[var(--color-canvas-2)] text-[var(--color-ink-3)]">
            <Utensils className="h-7 w-7" />
          </div>
        )
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
              {listing.title}
            </h3>
            {listing.restaurantName || listing.cityName ? (
              <div className="mt-0.5 truncate text-xs text-[var(--color-ink-2)]">
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

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Field
            label="Quantity"
            value={`${listing.quantity} ${listing.quantityUnit}`}
          />
          <Field
            label="Type"
            value={
              FOOD_TYPE_LABELS[listing.foodType as FoodType] ?? listing.foodType
            }
          />
          <Field
            label="Pickup"
            value={
              <>
                <span className="block">
                  {formatTime(listing.pickupStartTime)}
                </span>
                <span className="block text-[var(--color-ink-3)]">
                  → {formatTime(listing.pickupEndTime)}
                </span>
              </>
            }
          />
          <Field label="Expires" value={formatTime(listing.expiryTime)} />
          <Field
            label="Distance"
            value={
              listing.distanceKm != null
                ? formatDistance(listing.distanceKm)
                : '—'
            }
          />
          <Field
            label="Area"
            value={
              listing.restaurantAddress?.trim() ||
              listing.cityName ||
              (listing.latitude != null && listing.longitude != null
                ? `${listing.latitude.toFixed(3)}, ${listing.longitude.toFixed(3)}`
                : '—')
            }
            icon={<MapPin className="h-3 w-3 text-[var(--color-ink-3)]" />}
          />
        </dl>

        {listing.foodCategory && !listing.imageUrl ? (
          <div className="text-[11px] font-medium text-[var(--color-ink-2)]">
            {FOOD_CATEGORY_LABELS[listing.foodCategory as FoodCategory] ??
              listing.foodCategory}
          </div>
        ) : null}

        {action ? (
          <Button
            variant="accent"
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
  label,
  value,
  icon,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-[13px] text-[var(--color-ink)]">{value}</div>
    </div>
  )
}

// Fixed timezone so SSR (server TZ) and client (browser TZ) render identical
// strings — otherwise React 19 throws a hydration mismatch.
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
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
