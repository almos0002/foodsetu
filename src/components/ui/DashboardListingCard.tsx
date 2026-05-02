import { Link } from '@tanstack/react-router'
import { Clock, MapPin, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'

type Props = {
  to: string
  imageUrl?: string | null
  title: string
  /** Top-left badge over the photo (e.g. status badge). */
  badge?: ReactNode
  /** Secondary label rendered to the left of the meta line (e.g. quantity). */
  primaryMeta: string
  /** Right-side meta (e.g. relative time / pickup). */
  pickupAt?: Date | string | null
  /** Optional location/distance suffix shown beneath title. */
  location?: string | null
  /** Optional click target indicator. */
  trailing?: ReactNode
  className?: string
}

function formatPickup(d: Date): string {
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function DashboardListingCard({
  to,
  imageUrl,
  title,
  badge,
  primaryMeta,
  pickupAt,
  location,
  trailing,
  className,
}: Props) {
  const pickupDate =
    pickupAt instanceof Date ? pickupAt : pickupAt ? new Date(pickupAt) : null
  return (
    <Link
      to={to}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={imageUrl || FALLBACK_IMG}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {badge ? (
          <div className="absolute left-2.5 top-2.5">{badge}</div>
        ) : null}
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            {title}
          </h3>
          {trailing}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Utensils className="h-3 w-3" />
            <span className="tabular-nums">{primaryMeta}</span>
          </span>
          {pickupDate ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="tabular-nums">{formatPickup(pickupDate)}</span>
            </span>
          ) : null}
          {location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
