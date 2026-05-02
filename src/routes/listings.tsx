import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock,
  LogIn,
  MapPin,
  PawPrint,
  Sparkles,
  Utensils,
} from 'lucide-react'
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
    <div className="paper-grain min-h-screen text-[var(--color-ink)] antialiased">
      <header className="sticky top-0 z-30 border-b border-[var(--color-rule)] bg-[var(--color-paper)]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5 sm:h-[72px] sm:px-8 lg:px-14">
          <Link to="/" className="flex items-center gap-3">
            <BowlMark className="h-7 w-7 text-[var(--color-ember)]" />
            <div className="leading-none">
              <div className="font-display text-[22px] font-medium tracking-tight text-[var(--color-ink)]">
                FoodSetu
              </div>
              <div className="eyebrow mt-1 text-[var(--color-ink-500)]">
                The Ledger · Today
              </div>
            </div>
          </Link>
          <nav className="ml-auto flex items-center gap-1 sm:gap-3">
            <Link
              to="/"
              className="editorial-link hidden text-sm font-medium text-[var(--color-ink-700)] sm:inline-flex"
            >
              Home
            </Link>
            <span className="mx-2 hidden h-5 w-px bg-[var(--color-rule)] sm:block" />
            {!isPending && user ? (
              <Link
                to={roleToDashboard(user.role)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-ember)]"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-paper-200)]"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-ember)]"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Editorial masthead for the ledger */}
      <section className="border-b border-[var(--color-rule)]">
        <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-10 sm:px-8 lg:px-14 lg:pt-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-ink-500)] hover:text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to the masthead
          </Link>
          <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <div className="eyebrow text-[var(--color-ink-500)]">
                Today&rsquo;s ledger ·{' '}
                <span className="tabular-nums">
                  {String(listings.length).padStart(2, '0')}
                </span>{' '}
                live
              </div>
              <h1 className="font-display mt-4 text-[clamp(2.5rem,6vw,5rem)] font-light leading-[0.95] tracking-tight text-[var(--color-ink)]">
                Surplus,{' '}
                <span className="font-display-italic text-[var(--color-ember)]">
                  plainly
                </span>{' '}
                listed.
              </h1>
              <p className="mt-5 max-w-xl text-base text-[var(--color-ink-700)]">
                Live entries from partner kitchens across{' '}
                <span className="font-medium text-[var(--color-ink)]">
                  {cities.size > 0 ? cities.size : 1}
                </span>{' '}
                {cities.size === 1 ? 'city' : 'cities'}. Sign in as a verified
                NGO or animal rescue to claim a pickup — restaurant phone
                revealed only when your claim is accepted.
              </p>
            </div>
            {!user ? (
              <div className="lg:col-span-4 lg:text-right">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-ink)] px-6 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-ember)]"
                >
                  <Sparkles className="h-4 w-4" />
                  Sign up to claim
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Filter rail — chunky pills with counts, hairline-anchored */}
      <section className="border-b border-[var(--color-rule)] bg-[var(--color-paper-200)]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-5 py-4 sm:px-8 lg:px-14">
          <span className="eyebrow mr-3 text-[var(--color-ink-500)]">
            Filter
          </span>
          {(
            [
              { key: 'ALL', label: 'All entries', icon: Utensils },
              { key: 'HUMAN_SAFE', label: 'Human-safe', icon: Sparkles },
              { key: 'ANIMAL_SAFE', label: 'Animal-safe', icon: PawPrint },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key
            const Icon = tab.icon
            const count = counts[tab.key]
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ember)] focus-visible:ring-offset-2 ${
                  active
                    ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]'
                    : 'border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink-700)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span
                  className={`ml-1 rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
                    active
                      ? 'bg-[var(--color-ember)] text-[var(--color-paper)]'
                      : 'bg-[var(--color-paper-300)] text-[var(--color-ink-700)]'
                  }`}
                >
                  {String(count).padStart(2, '0')}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* The grid */}
      <section className="bg-[var(--color-paper)]">
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-14">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-rule)] p-14 text-center">
              <BowlMark className="mx-auto h-8 w-8 text-[var(--color-ember)]" />
              <p className="font-display mt-4 text-2xl font-light text-[var(--color-ink)]">
                Nothing under this category — yet.
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink-500)]">
                New entries arrive throughout the day. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((l, i) => (
                <PublicListingCard
                  key={l.id}
                  listing={l}
                  index={i}
                  ctaHref={ctaForUser}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[var(--color-rule)] bg-[var(--color-paper)]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-5 py-8 text-sm text-[var(--color-ink-500)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
          <div className="flex items-center gap-3">
            <BowlMark className="h-5 w-5 text-[var(--color-ember)]" />
            <span>© {new Date().getFullYear()} FoodSetu</span>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="editorial-link">
              Home
            </Link>
            <Link to="/login" className="editorial-link">
              Sign in
            </Link>
            <Link to="/register" className="editorial-link">
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
  index,
  ctaHref,
}: {
  listing: PublicListingRow
  index: number
  ctaHref: { to: string; label: string } | null
}) {
  const isAnimal = listing.foodCategory === 'ANIMAL_SAFE'
  const tag = isAnimal ? 'Animal-safe' : 'Human-safe'
  const pickup = formatPickup(listing.pickupStartTime, listing.pickupEndTime)
  const subtitle =
    listing.cityName ?? listing.orgName ?? 'Pickup confirmed on claim'

  return (
    <article className="group flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-paper-200)]">
        <img
          src={listing.imageUrl ?? FALLBACK_LISTING_IMG}
          alt={listing.title}
          className="aspect-[4/5] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-paper)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-ink)]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAnimal ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-ember)]'
            }`}
          />
          {tag}
        </span>
        <span className="font-display absolute right-3 top-2 text-[28px] font-light leading-none text-[var(--color-paper)] tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <div className="eyebrow text-[var(--color-ink-500)]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {subtitle}
            </span>
          </div>
          <h3 className="font-display mt-1.5 text-[22px] font-light leading-tight text-[var(--color-ink)] line-clamp-2">
            {listing.title}
          </h3>
        </div>
        <dl className="flex items-center gap-4 border-y border-[var(--color-rule)] py-3 text-sm">
          <div>
            <dt className="eyebrow text-[var(--color-ink-500)]">Qty</dt>
            <dd className="mt-1 font-medium tabular-nums text-[var(--color-ink)]">
              {listing.quantity} {listing.quantityUnit.toLowerCase()}
            </dd>
          </div>
          <span className="h-8 w-px bg-[var(--color-rule)]" />
          <div className="min-w-0 flex-1">
            <dt className="eyebrow inline-flex items-center gap-1 text-[var(--color-ink-500)]">
              <Clock className="h-3 w-3" />
              Pickup
            </dt>
            <dd className="mt-1 truncate text-sm font-medium tabular-nums text-[var(--color-ink)]">
              {pickup}
            </dd>
          </div>
        </dl>
        {ctaHref ? (
          <Link
            to={ctaHref.to}
            className="inline-flex h-11 items-center justify-between gap-2 rounded-full bg-[var(--color-ink)] px-5 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-ember)]"
          >
            <span>{ctaHref.label}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/register"
            className="editorial-link inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ink)]"
          >
            Sign up to claim
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </article>
  )
}

/* Editorial bowl mark — same as homepage. */
function BowlMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M4 14.5h24c0 6.5-5.4 11.5-12 11.5S4 21 4 14.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M2 14.5h28"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 4c-1.4 1.6-1.4 3.4 0 5s1.4 3.4 0 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M11 6c-1 1.2-1 2.6 0 3.8M21 6c-1 1.2-1 2.6 0 3.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
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
