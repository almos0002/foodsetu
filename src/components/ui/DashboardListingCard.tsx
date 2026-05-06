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
  badge?: ReactNode
  primaryMeta: string
  pickupAt?: Date | string | null
  location?: string | null
  trailing?: ReactNode
  className?: string
}

function formatPickup(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
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
        'group block overflow-hidden squircle border border-[var(--color-line)] bg-[var(--color-canvas)] transition-colors hover:border-[var(--color-line-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2',
        className,
      )}
    >
      <div className="relative h-48 w-full overflow-hidden bg-[var(--color-canvas-3)]">
        <img
          src={imageUrl || FALLBACK_IMG}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {badge ? <div className="absolute left-3 top-3">{badge}</div> : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
            {title}
          </h3>
          {trailing}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-2)]">
          <span className="inline-flex items-center gap-1">
            <Utensils className="h-3 w-3 text-[var(--color-ink-3)]" />
            <span className="tabular-nums font-medium">{primaryMeta}</span>
          </span>
          {pickupDate ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-[var(--color-ink-3)]" />
              <span className="tabular-nums">{formatPickup(pickupDate)}</span>
            </span>
          ) : null}
          {location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[var(--color-ink-3)]" />
              <span className="truncate">{location}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
