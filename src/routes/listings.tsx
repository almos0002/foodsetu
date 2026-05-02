import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Clock,
  LogIn,
  MapPin,
  PawPrint,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useSession } from '../lib/auth-client'
import { roleToDashboard } from '../lib/permissions'
import { listPublicAvailableListingsFn } from '../lib/public-listings-server'
import type { PublicListingRow } from '../lib/public-listings-server'

const FALLBACK_LISTING_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'

type CategoryFilter = 'ALL' | 'HUMAN_SAFE' | 'ANIMAL_SAFE'

export const Route = createFileRoute('/listings')({
  loader: async () => {
    const listings = await listPublicAvailableListingsFn({
      data: { category: 'ALL', limit: 60 },
    }).catch(() => [] as PublicListingRow[])
    return { listings }
  },
  component: BrowseListings,
})

function BrowseListings() {
  const { listings } = Route.useLoaderData()
  const { data: session, isPending } = useSession()
  const user = session?.user as
    | { name?: string | null; role?: string | null }
    | undefined
  const [filter, setFilter] = useState<CategoryFilter>('ALL')

  const ctaForUser = user ? destinationFor(user.role) : null

  const filtered = useMemo(
    () =>
      filter === 'ALL'
        ? listings
        : listings.filter((l) => l.foodCategory === filter),
    [filter, listings],
  )

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-20 sm:px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white">
              <Utensils className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">FoodSetu</span>
          </Link>

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:inline-flex"
            >
              Home
            </Link>
            {!isPending && user ? (
              <Link to={roleToDashboard(user.role)}>
                <Button>Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    leftIcon={<LogIn className="h-4 w-4" />}
                  >
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button>Get started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Surplus listings
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Live surplus from our partner kitchens. Sign in as a verified NGO
              or animal rescue to claim a pickup.
            </p>
          </div>
          {!user ? (
            <Link to="/register">
              <Button rightIcon={<Sparkles className="h-4 w-4" />}>
                Sign up to claim
              </Button>
            </Link>
          ) : null}
        </div>

        {/* Filter tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-1">
          {(
            [
              { key: 'ALL', label: 'All listings', icon: Utensils },
              { key: 'HUMAN_SAFE', label: 'Human-safe', icon: Sparkles },
              { key: 'ANIMAL_SAFE', label: 'Animal-safe', icon: PawPrint },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                  active
                    ? 'border-orange-600 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <Utensils className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              No live listings in this category
            </p>
            <p className="mt-1 text-sm text-gray-500">
              New surplus is posted throughout the day. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((l) => (
              <PublicListingCard
                key={l.id}
                listing={l}
                ctaHref={ctaForUser}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <div>© {new Date().getFullYear()} FoodSetu</div>
          <div className="flex gap-5">
            <Link to="/" className="hover:text-gray-900">
              Home
            </Link>
            <Link to="/login" className="hover:text-gray-900">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-gray-900">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function destinationFor(role: string | null | undefined): {
  to: string
  label: string
} {
  switch (role) {
    case 'NGO':
      return { to: '/ngo/nearby-food', label: 'View in dashboard' }
    case 'ANIMAL_RESCUE':
      return { to: '/animal/nearby-food', label: 'View in dashboard' }
    case 'RESTAURANT':
      return { to: '/restaurant/dashboard', label: 'Open dashboard' }
    case 'ADMIN':
      return { to: '/admin/dashboard', label: 'Open admin' }
    default:
      return { to: '/login', label: 'Sign in to claim' }
  }
}

function PublicListingCard({
  listing,
  ctaHref,
}: {
  listing: PublicListingRow
  ctaHref: { to: string; label: string } | null
}) {
  const isAnimal = listing.foodCategory === 'ANIMAL_SAFE'
  const tone = isAnimal
    ? 'bg-blue-100 text-blue-700'
    : 'bg-emerald-100 text-emerald-700'
  const tagLabel = isAnimal ? 'Animal-safe' : 'Human-safe'
  const pickup = formatPickup(listing.pickupStartTime, listing.pickupEndTime)
  const subtitle =
    listing.cityName ?? listing.orgName ?? 'Pickup confirmed on claim'

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-gray-300">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={listing.imageUrl ?? FALLBACK_LISTING_IMG}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}
        >
          {tagLabel}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-gray-900">
            {listing.title}
          </h3>
          <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {subtitle}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="Quantity">
            {listing.quantity} {listing.quantityUnit.toLowerCase()}
          </Stat>
          <Stat label="Pickup">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pickup}
            </span>
          </Stat>
        </div>
        {ctaHref ? (
          <Link
            to={ctaHref.to}
            className="mt-auto inline-flex items-center justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            {ctaHref.label}
          </Link>
        ) : (
          <Link
            to="/register"
            className="mt-auto inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Sign up to claim
          </Link>
        )}
      </div>
    </article>
  )
}

function Stat({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-0.5 text-xs text-gray-900">{children}</div>
    </div>
  )
}

// All times rendered in Asia/Kolkata so SSR (server TZ) and client (browser
// TZ) produce identical strings — otherwise hydration mismatches.
const TZ = 'Asia/Kolkata'
const ymdInTz = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)

function formatPickup(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const startYmd = ymdInTz(start)
  const sameDay = startYmd === ymdInTz(now)
  const isTomorrow = startYmd === ymdInTz(tomorrow)
  const dayLabel = sameDay
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : new Intl.DateTimeFormat('en-US', {
          timeZone: TZ,
          weekday: 'short',
          day: 'numeric',
        }).format(start)
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hour: 'numeric',
      minute: '2-digit',
    }).format(d)
  return `${dayLabel} · ${fmt(start)}–${fmt(end)}`
}
