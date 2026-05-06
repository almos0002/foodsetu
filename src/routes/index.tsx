import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  HeartHandshake,
  LogIn,
  MapPin,
  PawPrint,
  ShieldCheck,
  UserPlus,
  Utensils,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from '../lib/auth-client'
import { roleToDashboard } from '../lib/permissions'
import { listPublicAvailableListingsFn } from '../lib/public-listings-server'
import type { PublicListingRow } from '../lib/public-listings-server'
import { pageHead } from '../lib/seo'

export const Route = createFileRoute('/')({
  head: () =>
    pageHead({
      title: "FoodSetu — Nepal's free surplus food network",
      description:
        'FoodSetu redirects surplus restaurant food to verified NGOs and animal rescues across Nepal. OTP-secured handoffs, audited claims, free forever.',
      path: '/',
    }),
  loader: async () => {
    const listings = await listPublicAvailableListingsFn({
      data: { category: 'ALL', limit: 6 },
    }).catch(() => [] as PublicListingRow[])
    return { listings }
  },
  component: Home,
})

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop&q=80'

function Home() {
  const { data: session, isPending } = useSession()
  const { listings } = Route.useLoaderData()
  const user = session?.user as
    | { name?: string | null; role?: string | null }
    | undefined

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)] antialiased">
      <NavBar user={user} isPending={isPending} />
      <Hero />
      <LogosTape />
      <HowItWorks />
      <TodaysPicks listings={listings} />
      <Numbers />
      <Roles />
      <FinalCta loggedIn={!!user} />
      <Footer />
    </div>
  )
}

/* ───────────────────────── Brand mark ────────────────────────────────── */

/**
 * Minimal monogram mark — two interlocking rounded shapes that read as
 * "F + S" / "give + receive". Used in the navbar, footer, login, register,
 * and listings pages. Replaces the previous cartoon bowl mascot but kept
 * the export name `BowlMascot` so existing imports keep working.
 */
export function BowlMascot({
  className,
}: {
  className?: string
  /* legacy props — accepted but ignored so old call-sites compile */
  smiling?: boolean
  sleepy?: boolean
  steamCount?: number
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="8"
        fill="var(--color-ink)"
      />
      {/* Stylised "F" left half */}
      <path
        d="M9.5 9 H 19 M9.5 9 V 23 M9.5 16 H 16"
        stroke="var(--color-canvas)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Accent dot — the one bit of color in the mark */}
      <circle cx="22.5" cy="22.5" r="2.2" fill="var(--color-accent)" />
    </svg>
  )
}

/* ───────────────────────── Nav ───────────────────────────────────────── */

function NavBar({
  user,
  isPending,
}: {
  user: { name?: string | null; role?: string | null } | undefined
  isPending: boolean
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BowlMascot className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight">
            FoodSetu
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            to="/listings"
            className="text-sm text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
          >
            Listings
          </Link>
          <a
            href="#how"
            className="text-sm text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
          >
            How it works
          </a>
          <a
            href="#roles"
            className="text-sm text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
          >
            Partners
          </a>
          <a
            href="#numbers"
            className="text-sm text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
          >
            Impact
          </a>
        </nav>

        <div className="flex items-center gap-1.5">
          {!isPending && user ? (
            <Link
              to={roleToDashboard(user.role)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-ink)] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent)]"
            >
              Dashboard
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
  )
}

/* ───────────────────────── Hero ──────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-line)]">
      {/* Soft grid backdrop — faint, only on this section */}
      <div
        className="grid-bg pointer-events-none absolute inset-0 opacity-[0.55]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,var(--color-accent-soft)_0%,transparent_55%)] opacity-50"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1200px] px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-7">
            <LiveBadge />
            <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Nepal&apos;s free surplus food network
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,5.6vw,4.25rem)] leading-[1.05]">
              Surplus food,
              <br />
              matched in <RotatingWord />
              <br />
              <span className="text-[var(--color-ink-3)]">not the bin.</span>
            </h1>
            <p className="mt-7 max-w-lg text-[17px] leading-[1.55] text-[var(--color-ink-2)]">
              FoodSetu connects restaurants and bakeries with verified NGOs
              and animal rescues. We handle the OTP handoff, paperwork, and
              audit trail — so good food finds the right hands, fast.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-2.5">
              <Link
                to="/register"
                className="group inline-flex h-12 items-center gap-2 rounded-md bg-[var(--color-ink)] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--color-accent)]"
              >
                Start in 60 seconds
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/listings"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-5 text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-canvas-2)]"
              >
                Browse live listings
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--color-ink-2)]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
                Verified partners only
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
                Free, forever
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
                No card required
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroPanel />
          </div>
        </div>
      </div>
    </section>
  )
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-ink-2)]">
      <span className="live-dot" />
      <span className="text-[var(--color-ink)]">Live</span>
      in Kathmandu, Pokhara, Lalitpur
      <span className="text-[var(--color-ink-3)]">+ 2</span>
    </span>
  )
}

const ROTATING_WORDS = ['minutes.', 'meals.', 'kilos.', 'minds.']

function RotatingWord() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setI((prev) => (prev + 1) % ROTATING_WORDS.length),
      2400,
    )
    return () => clearInterval(id)
  }, [])
  const widest = ROTATING_WORDS.reduce((a, b) =>
    a.length >= b.length ? a : b,
  )
  return (
    <span
      className="relative inline-block overflow-hidden align-bottom text-[var(--color-accent)]"
      style={{ height: '1.05em', lineHeight: '1.05em', verticalAlign: 'bottom' }}
    >
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {widest}
      </span>
      {ROTATING_WORDS.map((w, idx) => (
        <span
          key={w}
          aria-hidden={idx !== i}
          className="absolute left-0 top-0 whitespace-nowrap transition-all duration-500 ease-out"
          style={{
            opacity: idx === i ? 1 : 0,
            transform:
              idx === i
                ? 'translateY(0)'
                : idx === (i - 1 + ROTATING_WORDS.length) % ROTATING_WORDS.length
                  ? 'translateY(-100%)'
                  : 'translateY(100%)',
          }}
        >
          {w}
        </span>
      ))}
    </span>
  )
}

function HeroPanel() {
  return (
    <div className="relative">
      {/* Main image card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="aspect-[5/6] w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop&q=80"
            alt="Freshly cooked surplus meal ready for pickup"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Bottom info bar inside the card */}
        <div className="absolute inset-x-3 bottom-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/95 p-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-accent)]">
                <span className="live-dot" />
                Available now
              </div>
              <div className="mt-1 truncate text-[14px] font-semibold">
                28 portions · Daal bhat
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--color-ink-3)] numeric">
                <MapPin className="h-3 w-3" />
                Thamel
                <span className="h-2.5 w-px bg-[var(--color-line)]" />
                <Clock className="h-3 w-3" />
                Pickup by 9:30 PM
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-[var(--color-ink)] px-2.5 text-[11px] font-medium text-white"
            >
              Claim
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating stat — top-right */}
      <div className="absolute -right-3 -top-4 hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 sm:block">
        <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
          Avg. handoff
        </div>
        <div className="mt-1 text-[20px] font-semibold leading-none numeric">
          7 min
        </div>
      </div>

      {/* Floating stat — bottom-left */}
      <div className="absolute -bottom-4 -left-3 hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 sm:block">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
          <ShieldCheck className="h-3 w-3 text-[var(--color-accent)]" />
          This week
        </div>
        <div className="mt-1 text-[20px] font-semibold leading-none numeric">
          1,284 meals
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Logo / partner tape ───────────────────────── */

function LogosTape() {
  const partners = [
    'Bhojan Griha',
    'Thakali Kitchen',
    'Sarvanam Trust',
    'Karuna Nepal',
    'Himalayan Java Bakers',
    'CARE Nepal',
    'Hopscotch Cafe',
    'KAT Centre Kathmandu',
    'Roadhouse Bakehouse',
    'Project Mukti',
  ]
  return (
    <section className="border-b border-[var(--color-line)] bg-[var(--color-canvas-2)] py-8">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="text-center text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
          Trusted by 184 kitchens, NGOs and rescues
        </div>
        <div className="mask-fade-x relative mt-5 overflow-hidden">
          <div className="marquee flex w-max gap-12 whitespace-nowrap">
            {[...partners, ...partners].map((p, i) => (
              <div
                key={`${p}-${i}`}
                className="flex items-center gap-2 text-[14px] font-medium text-[var(--color-ink-2)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-line-strong)]" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── How it works ──────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Restaurants post surplus',
      body: 'Snap, tag, set a pickup window. A new listing goes live in under a minute.',
      icon: Utensils,
    },
    {
      n: '02',
      title: 'Verified rescues claim it',
      body: 'NGOs see human-safe meals, animal rescues see animal-safe scraps. Categories never mix.',
      icon: ShieldCheck,
    },
    {
      n: '03',
      title: 'OTP handoff at pickup',
      body: 'A one-time code closes the loop. Every meal logged. Every claim auditable.',
      icon: HeartHandshake,
    },
  ]
  return (
    <section
      id="how"
      className="border-b border-[var(--color-line)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="eyebrow">How it works</div>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.05]">
              Three steps.
              <br />
              Zero paperwork.
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[var(--color-ink-2)]">
              The whole flow is built around the people doing the work — not
              the people watching it. No spreadsheets, no chasing.
            </p>
          </div>

          <div className="lg:col-span-8">
            <ol className="grid gap-px overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-3">
              {steps.map((s) => {
                const Icon = s.icon
                return (
                  <li
                    key={s.n}
                    className="group relative flex flex-col bg-[var(--color-paper)] p-6 transition-colors hover:bg-[var(--color-canvas-2)] sm:p-7"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium tabular-nums tracking-wider text-[var(--color-ink-3)]">
                        STEP {s.n}
                      </span>
                      <Icon
                        className="h-4 w-4 text-[var(--color-ink-3)] transition-colors group-hover:text-[var(--color-accent)]"
                        strokeWidth={1.6}
                      />
                    </div>
                    <h3 className="mt-8 text-[17px] font-semibold leading-snug">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
                      {s.body}
                    </p>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Today's picks ─────────────────────────────── */

function TodaysPicks({ listings }: { listings: PublicListingRow[] }) {
  return (
    <section className="border-b border-[var(--color-line)] bg-[var(--color-canvas-2)] py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow inline-flex items-center gap-2">
              <span className="live-dot" />
              Live now
            </div>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1.05]">
              On the menu today
            </h2>
            <p className="mt-3 max-w-md text-[15px] text-[var(--color-ink-2)]">
              {listings.length > 0
                ? `${listings.length} surplus ${listings.length === 1 ? 'meal' : 'meals'} waiting for a verified rescue. Sign in to claim.`
                : 'New entries roll in throughout the day. Check back soon — or sign up to be notified.'}
            </p>
          </div>
          <Link
            to="/listings"
            className="group inline-flex h-10 items-center gap-1.5 rounded-md border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-4 text-[13px] font-medium transition-colors hover:bg-[var(--color-ink)] hover:text-white"
          >
            See all listings
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <EmptyShelf />
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.slice(0, 6).map((l) => (
              <PublicCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyShelf() {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-paper)] p-12 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-canvas-2)]">
        <Utensils
          className="h-5 w-5 text-[var(--color-ink-3)]"
          strokeWidth={1.5}
        />
      </div>
      <p className="mt-5 text-[18px] font-semibold">Shelf is empty for now.</p>
      <p className="mt-1.5 text-[13.5px] text-[var(--color-ink-2)]">
        New meals get posted throughout the day.
      </p>
      <Link
        to="/register"
        className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-md bg-[var(--color-ink)] px-4 text-[13px] font-medium text-white hover:bg-[var(--color-accent)]"
      >
        Sign up to be notified
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

function PublicCard({ listing }: { listing: PublicListingRow }) {
  const isAnimal = listing.foodCategory === 'ANIMAL_SAFE'
  return (
    <Link
      to="/listings"
      className="group block overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] transition-all hover:border-[var(--color-line-strong)]"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[var(--color-canvas-3)]">
        <img
          src={listing.imageUrl ?? FALLBACK_IMG}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)]/95 px-2 py-1 text-[10.5px] font-medium backdrop-blur">
          {isAnimal ? (
            <PawPrint className="h-3 w-3 text-[var(--color-ink-2)]" />
          ) : (
            <Utensils className="h-3 w-3 text-[var(--color-accent)]" />
          )}
          {isAnimal ? 'Animal-safe' : 'Human-safe'}
        </span>
      </div>
      <div className="p-5">
        <h3 className="line-clamp-1 text-[15.5px] font-semibold tracking-tight">
          {listing.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-[var(--color-ink-2)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {listing.cityName ?? 'Pickup on claim'}
          </span>
          <span className="h-2.5 w-px bg-[var(--color-line)]" />
          <span className="inline-flex items-center gap-1 numeric">
            <Clock className="h-3 w-3" />
            {formatPickup(listing.pickupStartTime, listing.pickupEndTime)}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-line)] pt-4">
          <div className="text-[13.5px] font-semibold numeric">
            {listing.quantity}{' '}
            <span className="font-normal text-[var(--color-ink-2)]">
              {listing.quantityUnit.toLowerCase()}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--color-ink-2)] transition-colors group-hover:text-[var(--color-accent)]">
            View
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ───────────────────────── Numbers (impact band) ─────────────────────── */

function Numbers() {
  const items = [
    { v: '12,480', k: 'meals rescued', sub: 'across 5 cities' },
    { v: '184', k: 'partner kitchens', sub: 'verified, monthly active' },
    { v: '63', k: 'rescue teams', sub: 'NGOs + animal welfare' },
    { v: '7 min', k: 'median handoff', sub: 'post → claim → pickup' },
  ]
  return (
    <section
      id="numbers"
      className="border-b border-[var(--color-line)] bg-[var(--color-ink)] py-20 text-white sm:py-24"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow text-[var(--color-ink-4)]">Impact</div>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1.05]">
              Quietly composing,
              <br />
              <span className="text-[var(--color-accent)]">meal by meal.</span>
            </h2>
          </div>
          <p className="max-w-xs text-[14px] text-white/65">
            Every number on this page comes from the same database the
            dashboards run on. Updated nightly.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-4">
          {items.map((s) => (
            <div key={s.k} className="bg-[var(--color-ink)] p-7">
              <div className="font-display text-[clamp(2.4rem,4vw,3.4rem)] leading-none numeric">
                {s.v}
              </div>
              <div className="mt-4 text-[13px] font-medium text-white">
                {s.k}
              </div>
              <div className="mt-1 text-[12px] text-white/75">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Roles ─────────────────────────────────────── */

function Roles() {
  const cards = [
    {
      title: 'Restaurants & bakeries',
      desc: 'Turn closing-time surplus into a 60-second post. Built-in pickup windows mean no calls and no negotiation.',
      points: ['Free, unlimited posts', 'Photo + auto category', 'Cancel anytime'],
      cta: 'Become a partner kitchen',
      icon: Utensils,
    },
    {
      title: 'NGOs & feeding programs',
      desc: 'See only human-safe meals near you. Reserve in one tap, get the address and a contact line on accept.',
      points: ['City-filtered feed', 'Verified-only access', 'Audit history per claim'],
      cta: 'Join as a feeding NGO',
      icon: HeartHandshake,
    },
    {
      title: 'Animal rescues',
      desc: 'Animal-safe scraps are routed to you and only you — never mixed with NGO listings.',
      points: ['Category isolation', 'OTP handoff', 'Distance & time aware'],
      cta: 'Join as an animal rescue',
      icon: PawPrint,
    },
  ]
  return (
    <section
      id="roles"
      className="border-b border-[var(--color-line)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-xl">
          <div className="eyebrow">For partners</div>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.05]">
            Pick the side
            <br />
            you&rsquo;re on.
          </h2>
          <p className="mt-5 text-[15px] text-[var(--color-ink-2)]">
            Same platform, three views — each tuned to the work.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.title}
                className="group flex flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-7 transition-all hover:border-[var(--color-ink)]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-2)] text-[var(--color-ink)] transition-colors group-hover:border-[var(--color-accent)] group-hover:bg-[var(--color-accent-soft)] group-hover:text-[var(--color-accent-ink)]">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <h3 className="mt-6 text-[19px] font-semibold tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--color-ink-2)]">
                  {c.desc}
                </p>
                <ul className="mt-5 space-y-2">
                  {c.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2 text-[13px] text-[var(--color-ink-2)]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-7 inline-flex h-10 w-fit items-center gap-1.5 rounded-md border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-4 text-[13px] font-medium transition-colors hover:bg-[var(--color-ink)] hover:text-white"
                >
                  {c.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Final CTA ─────────────────────────────────── */

function FinalCta({ loggedIn }: { loggedIn: boolean }) {
  if (loggedIn) return null
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-line)] bg-[var(--color-canvas-2)] px-7 py-16 sm:px-14 sm:py-20">
          <div
            className="grid-bg pointer-events-none absolute inset-0 opacity-50"
            aria-hidden="true"
          />
          <div className="relative grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="eyebrow inline-flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                Free for everyone, forever
              </div>
              <h2 className="mt-5 font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.04]">
                Got a kitchen?
                <br />
                <span className="text-[var(--color-accent)]">
                  Got 60 seconds?
                </span>
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-2)]">
                Sign up, post your first surplus meal, and watch a verified
                rescue claim it. No card. No contracts. No catch.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-2.5">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-[var(--color-ink)] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--color-accent)]"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up — it&rsquo;s free
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-md border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-5 text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-canvas-3)]"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-6">
                <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
                  Today on FoodSetu
                </div>
                <ul className="mt-5 space-y-4">
                  <MiniRow
                    when="2 min ago"
                    text="Truffles posted 18 portions — paneer rice"
                  />
                  <MiniRow
                    when="9 min ago"
                    text="Akshaya Patra claimed 24 meals"
                    accent
                  />
                  <MiniRow
                    when="22 min ago"
                    text="CUPA picked up animal-safe scraps · OTP verified"
                  />
                  <MiniRow
                    when="41 min ago"
                    text="Glen's Bakehouse listed 12 loaves"
                  />
                </ul>
                <Link
                  to="/listings"
                  className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-2)]"
                >
                  See full activity feed
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniRow({
  when,
  text,
  accent,
}: {
  when: string
  text: string
  accent?: boolean
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-line-strong)]'}`}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] leading-snug text-[var(--color-ink)]">
          {text}
        </div>
        <div className="mt-0.5 text-[11.5px] text-[var(--color-ink-3)] numeric">
          {when}
        </div>
      </div>
    </li>
  )
}

/* ───────────────────────── Footer ────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-canvas)]">
      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <BowlMascot className="h-7 w-7" />
              <span className="text-[15px] font-semibold tracking-tight">
                FoodSetu
              </span>
            </div>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
              Surplus food infrastructure for kitchens, NGOs, and animal
              rescues. Built quietly in Kathmandu.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { to: '/listings', label: 'Browse listings' },
              { to: '/register', label: 'Get started' },
              { to: '/login', label: 'Sign in' },
            ]}
          />
          <FooterCol
            title="Partners"
            anchors={[
              { to: '#how', label: 'How it works' },
              { to: '#roles', label: 'For NGOs' },
              { to: '#numbers', label: 'Impact' },
            ]}
          />
          <FooterCol
            title="Company"
            anchors={[
              { to: '#', label: 'About' },
              { to: '#', label: 'Contact' },
              { to: '#', label: 'Press' },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-[var(--color-line)] pt-6 sm:flex-row sm:items-center">
          <div className="text-[12px] text-[var(--color-ink-3)] numeric">
            © 2026 FoodSetu · Made in Kathmandu
          </div>
          <div className="flex items-center gap-5 text-[12px] text-[var(--color-ink-3)]">
            <a href="#" className="hover:text-[var(--color-ink)]">
              Privacy
            </a>
            <a href="#" className="hover:text-[var(--color-ink)]">
              Terms
            </a>
            <a href="#" className="hover:text-[var(--color-ink)]">
              Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
  anchors,
}: {
  title: string
  links?: Array<{ to: string; label: string }>
  anchors?: Array<{ to: string; label: string }>
}) {
  return (
    <div className="lg:col-span-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
        {title}
      </div>
      <ul className="mt-4 space-y-2.5 text-[13.5px]">
        {links?.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              className="text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
        {anchors?.map((l) => (
          <li key={l.label}>
            <a
              href={l.to}
              className="text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ───────────────────────── TZ-safe time ──────────────────────────────── */

const TZ = 'Asia/Kathmandu'
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
