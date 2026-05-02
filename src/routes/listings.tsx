import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  Utensils,
} from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { roleToDashboard } from '../lib/permissions'
import { listPublicAvailableListingsFn } from '../lib/public-listings-server'
import type { PublicListingRow } from '../lib/public-listings-server'
import { BowlMascot } from './index'

const FALLBACK_IMG =
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

  const counts = useMemo(() => {
    const human = listings.filter((l) => l.foodCategory === 'HUMAN_SAFE').length
    const animal = listings.filter(
      (l) => l.foodCategory === 'ANIMAL_SAFE',
    ).length
    return { ALL: listings.length, HUMAN_SAFE: human, ANIMAL_SAFE: animal }
  }, [listings])

  const filtered = useMemo(
    () =>
      filter === 'ALL'
        ? listings
        : listings.filter((l) => l.foodCategory === filter),
    [filter, listings],
  )

  const cities = new Set(
    listings.map((l) => l.cityName).filter(Boolean) as Array<string>,
  )

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] antialiased">
      <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <BowlMascot className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight">
              FoodSetu
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            {!isPending && user ? (
              <Link
                to={ctaForUser?.to ?? roleToDashboard(user.role)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-ink)] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent)]"
              >
                {ctaForUser?.label ?? 'Open dashboard'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden h-9 items-center rounded-md px-3 text-[13px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-canvas-2)] hover:text-[var(--color-ink)] sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-ink)] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent)]"
                >
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page header */}
      <section className="border-b border-[var(--color-line)]">
        <div className="mx-auto max-w-[1200px] px-5 pb-12 pt-10 sm:px-8 lg:pt-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-ink-2)]">
                <span className="live-dot" />
                <span className="text-[var(--color-ink)]">
                  {listings.length} live
                </span>
                <span className="h-2.5 w-px bg-[var(--color-line)]" />
                {cities.size > 0 ? cities.size : 1}{' '}
                {cities.size === 1 ? 'city' : 'cities'}
              </span>
              <h1 className="font-display mt-5 text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.05]">
                Live listings
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-2)]">
                Real-time entries from partner kitchens. Verified NGOs and
                animal rescues can claim — restaurant phone is revealed only
                after the claim is accepted.
              </p>
            </div>
            {!user ? (
              <div className="lg:col-span-4 lg:text-right">
                <Link
                  to="/register"
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--color-ink)] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--color-accent)]"
                >
                  Sign up to claim
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-canvas-2)]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2 px-5 py-4 sm:px-8">
          <span className="tiny-cap mr-2 text-[var(--color-ink-3)]">
            Filter
          </span>
          <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] p-1">
            {(
              [
                { key: 'ALL', label: 'All' },
                { key: 'HUMAN_SAFE', label: 'Human-safe' },
                { key: 'ANIMAL_SAFE', label: 'Animal-safe' },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key
              const count = counts[tab.key]
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[var(--color-ink)] text-white'
                      : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium tabular-nums ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--color-canvas-3)] text-[var(--color-ink-3)]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-[var(--color-canvas)]">
        <div className="mx-auto max-w-[1200px] px-5 pb-20 pt-10 sm:px-8">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-canvas-2)] p-12 text-center">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)]">
                <Utensils
                  className="h-5 w-5 text-[var(--color-ink-3)]"
                  strokeWidth={1.5}
                />
              </div>
              <p className="mt-5 text-[18px] font-semibold tracking-tight">
                Nothing in this category yet
              </p>
              <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-2)]">
                New entries arrive throughout the day. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((l) => (
                <ListingCard key={l.id} listing={l} ctaHref={ctaForUser} />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-canvas-2)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 py-8 text-sm text-[var(--color-ink-2)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <BowlMascot className="h-6 w-6" />
            <span className="text-[14px] font-semibold tracking-tight text-[var(--color-ink)]">
              FoodSetu
            </span>
          </div>
          <div className="flex gap-5 text-[13px]">
            <Link
              to="/"
              className="text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
            >
              Sign up
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

function ListingCard({
  listing,
  ctaHref,
}: {
  listing: PublicListingRow
  ctaHref: { to: string; label: string } | null
}) {
  const isAnimal = listing.foodCategory === 'ANIMAL_SAFE'
  const pickup = formatPickup(listing.pickupStartTime, listing.pickupEndTime)
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas)] transition-colors hover:border-[var(--color-line-strong)]">
      <div className="relative aspect-[5/4] overflow-hidden bg-[var(--color-canvas-3)]">
        <img
          src={listing.imageUrl ?? FALLBACK_IMG}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)]/95 px-2 py-1 text-[10.5px] font-medium text-[var(--color-ink)] backdrop-blur">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAnimal
                ? 'bg-[var(--color-warn)]'
                : 'bg-[var(--color-accent)]'
            }`}
          />
          {isAnimal ? 'Animal-safe' : 'Human-safe'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[15.5px] font-semibold leading-tight tracking-tight">
          {listing.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-[var(--color-ink-2)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 text-[var(--color-ink-3)]" />
            {listing.cityName ?? listing.orgName ?? 'Pickup on claim'}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-[var(--color-line)] py-3 text-sm">
          <div>
            <dt className="tiny-cap text-[var(--color-ink-3)]">Quantity</dt>
            <dd className="mt-1 text-[14px] font-medium tabular-nums">
              {listing.quantity}{' '}
              <span className="font-normal text-[var(--color-ink-2)]">
                {listing.quantityUnit.toLowerCase()}
              </span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="tiny-cap inline-flex items-center gap-1 text-[var(--color-ink-3)]">
              <Clock className="h-3 w-3" />
              Pickup
            </dt>
            <dd className="mt-1 truncate text-[14px] font-medium tabular-nums">
              {pickup}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-end">
          {ctaHref ? (
            <Link
              to={ctaHref.to}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-ink)] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent)]"
            >
              {ctaHref.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-line-strong)] bg-[var(--color-canvas)] px-3.5 text-[13px] font-medium transition-colors hover:bg-[var(--color-canvas-2)]"
            >
              Sign up to claim
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

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
