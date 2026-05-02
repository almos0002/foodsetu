import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  LogIn,
  MapPin,
  PawPrint,
  Salad,
  ShieldCheck,
  Sparkles,
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
      <header className="sticky top-0 z-30 border-b-[1.5px] border-[var(--color-line)] bg-[var(--color-canvas)]/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <BowlMascot className="h-9 w-9" />
            <span className="font-display text-[22px] font-bold tracking-tight">
              FoodSetu
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {!isPending && user ? (
              <Link
                to={ctaForUser?.to ?? roleToDashboard(user.role)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-coral)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-coral-2)]"
              >
                {ctaForUser?.label ?? 'Open dashboard'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold hover:bg-[var(--color-cream)] sm:inline-flex"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-coral)]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page header — bright + warm, sticker-style */}
      <section className="bg-[var(--color-cream)]">
        <div className="mx-auto max-w-[1280px] px-5 pb-10 pt-10 sm:px-8 lg:pt-16">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-coral)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <span className="bubble">
                <span className="h-2 w-2 rounded-full bg-[var(--color-mint)]" />
                {listings.length} live · {cities.size > 0 ? cities.size : 1}{' '}
                {cities.size === 1 ? 'city' : 'cities'}
              </span>
              <h1 className="font-display mt-5 text-[clamp(2.25rem,5.5vw,4.5rem)] font-bold leading-[0.95] tracking-tight">
                Pick a meal,
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10 text-[var(--color-coral)]">
                    save a meal
                  </span>
                  <span
                    className="absolute inset-x-0 bottom-2 z-0 h-3 bg-[var(--color-sun)]"
                    aria-hidden="true"
                  />
                </span>
                .
              </h1>
              <p className="mt-5 max-w-xl text-[15px] text-[var(--color-ink-2)]">
                Live entries from partner kitchens. Verified NGOs and animal
                rescues can claim — restaurant phone is revealed only after the
                claim is accepted.
              </p>
            </div>
            {!user ? (
              <div className="lg:col-span-4 lg:text-right">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-coral)] px-6 text-sm font-semibold text-white transition-all hover:bg-[var(--color-coral-2)] hover:-translate-y-0.5"
                >
                  <Sparkles className="h-4 w-4" />
                  Sign up to claim
                </Link>
              </div>
            ) : null}
          </div>
        </div>
        <div className="squiggle-mint" aria-hidden="true" />
      </section>

      {/* Filter chips */}
      <section className="bg-[var(--color-canvas)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-5 py-6 sm:px-8">
          <span className="tiny-cap mr-2 text-[var(--color-ink-3)]">
            Showing
          </span>
          {(
            [
              { key: 'ALL', label: 'Everything', icon: Utensils, tone: 'coral' },
              {
                key: 'HUMAN_SAFE',
                label: 'Human-safe',
                icon: Salad,
                tone: 'mint',
              },
              {
                key: 'ANIMAL_SAFE',
                label: 'Animal-safe',
                icon: PawPrint,
                tone: 'sun',
              },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key
            const Icon = tab.icon
            const count = counts[tab.key]
            const activeBg =
              tab.tone === 'coral'
                ? 'bg-[var(--color-coral)] text-white border-[var(--color-coral)]'
                : tab.tone === 'mint'
                  ? 'bg-[var(--color-mint)] text-white border-[var(--color-mint)]'
                  : 'bg-[var(--color-sun)] text-[var(--color-sun-ink)] border-[var(--color-sun)]'
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`pill border-[1.5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:ring-offset-2 ${
                  active
                    ? activeBg
                    : 'border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:border-[var(--color-line-strong)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={`ml-1 inline-flex h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                    active
                      ? 'bg-white/25 text-current'
                      : 'bg-[var(--color-cream)] text-[var(--color-ink-2)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Grid */}
      <section className="bg-[var(--color-canvas)]">
        <div className="mx-auto max-w-[1280px] px-5 pb-20 sm:px-8">
          {filtered.length === 0 ? (
            <div className="rounded-[28px] border-[1.5px] border-dashed border-[var(--color-line-strong)] bg-[var(--color-cream)] p-14 text-center">
              <div className="mx-auto h-16 w-16">
                <BowlMascot className="h-full w-full" sleepy />
              </div>
              <p className="font-display mt-5 text-2xl font-bold tracking-tight">
                Nothing in this category yet.
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink-2)]">
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

      <footer className="border-t-[1.5px] border-[var(--color-line)] bg-[var(--color-canvas)]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-8 text-sm text-[var(--color-ink-2)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <BowlMascot className="h-7 w-7" />
            <span className="font-display text-base font-bold">FoodSetu</span>
          </div>
          <div className="flex gap-5">
            <Link to="/" className="wavey-link">
              Home
            </Link>
            <Link to="/login" className="wavey-link">
              Sign in
            </Link>
            <Link to="/register" className="wavey-link">
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
    <article className="group flex flex-col overflow-hidden rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white transition-all hover:-translate-y-1 hover:border-[var(--color-line-strong)]">
      <div className="relative aspect-[5/4] overflow-hidden bg-[var(--color-cream-2)]">
        <img
          src={listing.imageUrl ?? FALLBACK_IMG}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`sticker absolute left-3 top-3 rotate-[-3deg] ${
            isAnimal
              ? 'bg-[var(--color-sun-soft)]'
              : 'bg-[var(--color-mint-soft)]'
          }`}
        >
          {isAnimal ? (
            <PawPrint className="h-3.5 w-3.5 text-[var(--color-sun-ink)]" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-mint-ink)]" />
          )}
          {isAnimal ? 'Animal-safe' : 'Human-safe'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display line-clamp-2 text-xl font-bold leading-tight tracking-tight">
          {listing.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-ink-2)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {listing.cityName ?? listing.orgName ?? 'Pickup on claim'}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-y-[1.5px] border-dashed border-[var(--color-line)] py-3 text-sm">
          <div>
            <dt className="tiny-cap text-[var(--color-ink-3)]">Quantity</dt>
            <dd className="mt-1 font-semibold tabular-nums">
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
            <dd className="mt-1 truncate text-sm font-semibold tabular-nums">
              {pickup}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between">
          {ctaHref ? (
            <Link
              to={ctaHref.to}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-coral)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-coral-2)]"
            >
              {ctaHref.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] border-[var(--color-ink)] bg-white px-4 text-sm font-semibold transition-all hover:bg-[var(--color-coral)] hover:text-white hover:border-[var(--color-coral)]"
            >
              Sign up to claim
              <ArrowRight className="h-4 w-4" />
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
