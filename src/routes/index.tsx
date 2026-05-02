import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  Clock,
  LogIn,
  MapPin,
  Salad,
  ShieldCheck,
  Sparkles,
  Truck,
  UserPlus,
} from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { roleToDashboard } from '../lib/permissions'
import { listPublicAvailableListingsFn } from '../lib/public-listings-server'
import type { PublicListingRow } from '../lib/public-listings-server'

export const Route = createFileRoute('/')({
  loader: async () => {
    const listings = await listPublicAvailableListingsFn({
      data: { category: 'ALL', limit: 6 },
    }).catch(() => [] as PublicListingRow[])
    return { listings }
  },
  component: Home,
})

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'

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
      <Stats />
      <HowItWorks />
      <TodaysPicks listings={listings} />
      <Roles />
      <FinalCta loggedIn={!!user} />
      <Footer />
    </div>
  )
}

/* ───────────────────────── Nav ─────────────────────────────────────── */

function NavBar({
  user,
  isPending,
}: {
  user: { name?: string | null; role?: string | null } | undefined
  isPending: boolean
}) {
  return (
    <header className="sticky top-0 z-30 border-b-[1.5px] border-[var(--color-line)] bg-[var(--color-canvas)]/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <BowlMascot className="h-9 w-9" />
          <span className="font-display text-[22px] font-bold tracking-tight">
            FoodSetu
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            to="/listings"
            className="wavey-link text-sm font-medium text-[var(--color-ink)]"
          >
            Browse food
          </Link>
          <a
            href="#how"
            className="wavey-link text-sm font-medium text-[var(--color-ink)]"
          >
            How it works
          </a>
          <a
            href="#roles"
            className="wavey-link text-sm font-medium text-[var(--color-ink)]"
          >
            For partners
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {!isPending && user ? (
            <Link
              to={roleToDashboard(user.role)}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-coral)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-coral-2)]"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-cream)] sm:inline-flex"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-coral)]"
              >
                <UserPlus className="h-4 w-4" />
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

/* ───────────────────────── Hero ────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="dotgrid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1280px] gap-10 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-7">
          <span className="bubble">
            <span className="h-2 w-2 rounded-full bg-[var(--color-mint)]" />
            Live in Bengaluru, today
          </span>
          <h1 className="font-display mt-6 text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-tight">
            Surplus food,
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 text-[var(--color-coral)]">
                picked up
              </span>
              <span
                className="absolute inset-x-0 bottom-2 z-0 h-3 bg-[var(--color-sun)]"
                aria-hidden="true"
              />
            </span>{' '}
            in minutes.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--color-ink-2)]">
            Restaurants post a meal. Verified NGOs and animal rescues claim it.
            We handle the OTP handoff, the paperwork, and the audit trail —
            so good food doesn&rsquo;t hit the bin.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex h-14 items-center gap-2 rounded-full bg-[var(--color-coral)] px-7 text-base font-semibold text-white transition-all hover:bg-[var(--color-coral-2)] hover:-translate-y-0.5"
            >
              <UserPlus className="h-5 w-5" />
              Sign up — it&rsquo;s free
            </Link>
            <Link
              to="/listings"
              className="inline-flex h-14 items-center gap-2 rounded-full border-[1.5px] border-[var(--color-ink)] bg-white px-7 text-base font-semibold text-[var(--color-ink)] transition-all hover:bg-[var(--color-cream)] hover:-translate-y-0.5"
            >
              See what&rsquo;s live
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--color-ink-2)]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[var(--color-mint)]" />
              Verified partners only
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[var(--color-coral)]" />
              No card. No contracts.
            </span>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <HeroIllustration />
        </div>
      </div>
      <div className="squiggle" aria-hidden="true" />
    </section>
  )
}

function HeroIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      {/* coral blob backdrop */}
      <div
        className="absolute inset-0 rounded-[42% 58% 60% 40% / 50% 45% 55% 50%] bg-[var(--color-coral-soft)]"
        style={{
          borderRadius: '52% 48% 60% 40% / 50% 45% 55% 50%',
        }}
        aria-hidden="true"
      />
      {/* mint sticker */}
      <div
        className="absolute -left-3 top-8 rotate-[-8deg] sticker bg-[var(--color-mint-soft)]"
        style={{ animation: 'var(--animate-bob)', '--bob-rot': '-8deg' } as React.CSSProperties}
      >
        <Salad className="h-3.5 w-3.5 text-[var(--color-mint-ink)]" />
        Fresh today
      </div>
      {/* sun sticker */}
      <div
        className="absolute right-2 top-20 rotate-[6deg] sticker bg-[var(--color-sun-soft)]"
        style={{ animation: 'var(--animate-bob) 7s', '--bob-rot': '6deg' } as React.CSSProperties}
      >
        <Clock className="h-3.5 w-3.5 text-[var(--color-sun-ink)]" />
        7 min handoff
      </div>
      {/* big bowl mascot */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <BowlMascot className="h-[78%] w-[78%]" smiling />
      </div>
      {/* berry sticker bottom */}
      <div
        className="absolute -bottom-2 left-10 rotate-[-4deg] sticker bg-[var(--color-berry-soft)]"
        style={{ animation: 'var(--animate-bob) 8s', '--bob-rot': '-4deg' } as React.CSSProperties}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-berry-ink)]" />
        Verified rescue
      </div>
    </div>
  )
}

/* ───────────────────────── Stats ───────────────────────────────────── */

function Stats() {
  const items: Array<{ k: string; v: string; tone: string }> = [
    { k: 'Meals rescued', v: '12,480', tone: 'coral' },
    { k: 'Partner kitchens', v: '184', tone: 'mint' },
    { k: 'Active rescues', v: '63', tone: 'sun' },
    { k: 'Cities live', v: '5', tone: 'berry' },
  ]
  const toneFor = (t: string) => {
    if (t === 'coral')
      return {
        bg: 'bg-[var(--color-coral-soft)]',
        ring: 'border-[var(--color-coral)]',
      }
    if (t === 'mint')
      return {
        bg: 'bg-[var(--color-mint-soft)]',
        ring: 'border-[var(--color-mint)]',
      }
    if (t === 'sun')
      return {
        bg: 'bg-[var(--color-sun-soft)]',
        ring: 'border-[var(--color-sun)]',
      }
    return {
      bg: 'bg-[var(--color-berry-soft)]',
      ring: 'border-[var(--color-berry)]',
    }
  }
  return (
    <section className="bg-[var(--color-cream)] py-14 sm:py-20">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((s, i) => {
            const t = toneFor(s.tone)
            const rot = ['-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1'][i]
            return (
              <div
                key={s.k}
                className={`${t.bg} ${rot} rounded-[28px] border-[1.5px] ${t.ring} p-6 transition-transform hover:rotate-0`}
              >
                <div className="font-display text-4xl font-bold leading-none tabular-nums sm:text-5xl">
                  {s.v}
                </div>
                <div className="tiny-cap mt-3 text-[var(--color-ink-2)]">
                  {s.k}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── How it works ────────────────────────────── */

function HowItWorks() {
  const steps: Array<{
    n: string
    title: string
    body: string
    icon: typeof Salad
    tone: 'coral' | 'mint' | 'sun'
  }> = [
    {
      n: '01',
      title: 'Restaurants post surplus',
      body: 'Snap a photo, set a pickup window. Your team is done in 60 seconds.',
      icon: Salad,
      tone: 'coral',
    },
    {
      n: '02',
      title: 'Verified rescues claim it',
      body: 'NGOs see human-safe meals. Animal rescues see animal-safe scraps. No mix-ups.',
      icon: ShieldCheck,
      tone: 'mint',
    },
    {
      n: '03',
      title: 'OTP handoff at pickup',
      body: 'Driver shares a one-time code. The meal is logged and the loop closes.',
      icon: Truck,
      tone: 'sun',
    },
  ]
  const toneClass = (t: string) =>
    t === 'coral'
      ? 'bg-[var(--color-coral)] text-white'
      : t === 'mint'
        ? 'bg-[var(--color-mint)] text-white'
        : 'bg-[var(--color-sun)] text-[var(--color-sun-ink)]'

  return (
    <section id="how" className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="max-w-2xl">
          <span className="tiny-cap text-[var(--color-coral)]">
            How it works
          </span>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Three steps, zero
            <br />
            paperwork.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {steps.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.n}
                className="relative rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-[var(--color-canvas)] p-7 transition-transform hover:-translate-y-1 hover:border-[var(--color-line-strong)]"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass(s.tone)}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="font-display mt-5 text-sm font-bold tabular-nums text-[var(--color-ink-3)]">
                  STEP {s.n}
                </div>
                <h3 className="font-display mt-1 text-2xl font-bold tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] text-[var(--color-ink-2)]">
                  {s.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Today's picks ───────────────────────────── */

function TodaysPicks({ listings }: { listings: PublicListingRow[] }) {
  return (
    <section className="bg-[var(--color-cream)] py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="tiny-cap text-[var(--color-mint)]">
              Live now
            </span>
            <h2 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              On the menu today
              <span className="text-[var(--color-coral)]">.</span>
            </h2>
            <p className="mt-3 max-w-xl text-[15px] text-[var(--color-ink-2)]">
              {listings.length > 0
                ? `${listings.length} surplus meal${listings.length === 1 ? '' : 's'} waiting for a verified rescue. Sign in to claim.`
                : 'New entries roll in throughout the day. Check back soon — or sign up to be notified.'}
            </p>
          </div>
          <Link
            to="/listings"
            className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-[var(--color-ink)] bg-white px-5 text-sm font-semibold transition-all hover:bg-[var(--color-coral)] hover:text-white hover:border-[var(--color-coral)]"
          >
            See all listings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {listings.length === 0 ? (
          <EmptyShelf />
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="mt-10 rounded-[28px] border-[1.5px] border-dashed border-[var(--color-line-strong)] bg-white p-12 text-center">
      <div className="mx-auto h-16 w-16">
        <BowlMascot className="h-full w-full" sleepy />
      </div>
      <p className="font-display mt-5 text-2xl font-bold tracking-tight">
        Shelf is empty for now.
      </p>
      <p className="mt-2 text-sm text-[var(--color-ink-2)]">
        New meals get posted throughout the day.
      </p>
      <Link
        to="/register"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-coral)] px-5 text-sm font-semibold text-white hover:bg-[var(--color-coral-2)]"
      >
        Sign up to be notified
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

function PublicCard({ listing }: { listing: PublicListingRow }) {
  const isAnimal = listing.foodCategory === 'ANIMAL_SAFE'
  return (
    <Link
      to="/listings"
      className="group block overflow-hidden rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white transition-all hover:-translate-y-1 hover:border-[var(--color-line-strong)]"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[var(--color-cream-2)]">
        <img
          src={listing.imageUrl ?? FALLBACK_IMG}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`sticker absolute left-3 top-3 rotate-[-3deg] ${isAnimal ? 'bg-[var(--color-sun-soft)]' : 'bg-[var(--color-mint-soft)]'}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${isAnimal ? 'bg-[var(--color-sun-ink)]' : 'bg-[var(--color-mint)]'}`}
          />
          {isAnimal ? 'Animal-safe' : 'Human-safe'}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display line-clamp-1 text-xl font-bold tracking-tight">
          {listing.title}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-ink-2)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {listing.cityName ?? 'Pickup on claim'}
          </span>
          <span className="h-3 w-px bg-[var(--color-line)]" />
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="h-3.5 w-3.5" />
            {formatPickup(listing.pickupStartTime, listing.pickupEndTime)}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t-[1.5px] border-dashed border-[var(--color-line)] pt-4">
          <div className="text-sm font-semibold tabular-nums">
            {listing.quantity}{' '}
            <span className="font-normal text-[var(--color-ink-2)]">
              {listing.quantityUnit.toLowerCase()}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-coral)]">
            View
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ───────────────────────── Roles ───────────────────────────────────── */

function Roles() {
  const cards = [
    {
      title: "I run a kitchen",
      bullet: 'Post surplus meals in 60 seconds',
      cta: 'Become a partner kitchen',
      tone: 'coral',
      icon: Salad,
    },
    {
      title: "I run an NGO",
      bullet: 'Find human-safe meals near you',
      cta: 'Join as a feeding NGO',
      tone: 'mint',
      icon: ShieldCheck,
    },
    {
      title: "I run a rescue",
      bullet: 'Pick up animal-safe scraps fast',
      cta: 'Join as an animal rescue',
      tone: 'sun',
      icon: Truck,
    },
  ] as const
  const tone = (t: string) => {
    if (t === 'coral')
      return {
        bg: 'bg-[var(--color-coral)]',
        text: 'text-white',
        soft: 'bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)]',
        rot: '-rotate-2',
      }
    if (t === 'mint')
      return {
        bg: 'bg-[var(--color-mint)]',
        text: 'text-white',
        soft: 'bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)]',
        rot: 'rotate-1',
      }
    return {
      bg: 'bg-[var(--color-sun)]',
      text: 'text-[var(--color-sun-ink)]',
      soft: 'bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)]',
      rot: '-rotate-1',
    }
  }
  return (
    <section id="roles" className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="max-w-2xl">
          <span className="tiny-cap text-[var(--color-mint)]">
            For partners
          </span>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Pick the side you&rsquo;re on.
          </h2>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {cards.map((c) => {
            const t = tone(c.tone)
            const Icon = c.icon
            return (
              <div
                key={c.title}
                className={`relative overflow-hidden rounded-[32px] border-[1.5px] border-[var(--color-ink)] ${t.bg} ${t.text} p-7 transition-transform hover:-translate-y-1`}
              >
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-ink)] bg-white text-[var(--color-ink)] ${t.rot}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-display mt-6 text-3xl font-bold tracking-tight">
                  {c.title}
                </h3>
                <p className="mt-3 text-[15px] opacity-90">{c.bullet}</p>
                <Link
                  to="/register"
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-[var(--color-ink)] bg-white px-5 text-sm font-semibold text-[var(--color-ink)] transition-transform hover:-translate-y-0.5"
                >
                  {c.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Final CTA ───────────────────────────────── */

function FinalCta({ loggedIn }: { loggedIn: boolean }) {
  if (loggedIn) return null
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="dotgrid relative overflow-hidden rounded-[40px] border-[1.5px] border-[var(--color-ink)] bg-[var(--color-coral-soft)] px-7 py-14 sm:px-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="bubble">
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-sun)]" />
                Free for everyone, forever
              </span>
              <h2 className="font-display mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
                Got a kitchen?
                <br />
                Got 60 seconds?
              </h2>
              <p className="mt-5 max-w-lg text-[16px] text-[var(--color-ink-2)]">
                Sign up, post your first surplus meal, and watch a verified
                rescue claim it.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex h-14 items-center gap-2 rounded-full bg-[var(--color-ink)] px-7 text-base font-semibold text-white transition-all hover:bg-[var(--color-coral)] hover:-translate-y-0.5"
                >
                  <UserPlus className="h-5 w-5" />
                  Sign up — it&rsquo;s free
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-14 items-center gap-2 rounded-full border-[1.5px] border-[var(--color-ink)] bg-white px-7 text-base font-semibold text-[var(--color-ink)] hover:-translate-y-0.5"
                >
                  <LogIn className="h-5 w-5" />
                  Sign in
                </Link>
              </div>
            </div>
            <div className="hidden lg:col-span-5 lg:block">
              <div className="relative mx-auto aspect-square max-w-sm">
                <BowlMascot
                  className="absolute inset-0 m-auto h-[88%] w-[88%]"
                  smiling
                  steamCount={4}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── Footer ──────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t-[1.5px] border-[var(--color-line)] bg-[var(--color-canvas)]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5">
          <BowlMascot className="h-7 w-7" />
          <span className="font-display text-lg font-bold tracking-tight">
            FoodSetu
          </span>
          <span className="text-sm text-[var(--color-ink-3)]">
            · made in Bengaluru
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--color-ink-2)]">
          <Link to="/listings" className="wavey-link">
            Browse food
          </Link>
          <Link to="/login" className="wavey-link">
            Sign in
          </Link>
          <Link to="/register" className="wavey-link">
            Sign up
          </Link>
        </nav>
        <div className="text-xs text-[var(--color-ink-3)]">
          © {new Date().getFullYear()} FoodSetu
        </div>
      </div>
    </footer>
  )
}

/* ───────────────────────── Mascot ──────────────────────────────────── */

export function BowlMascot({
  className,
  smiling,
  sleepy,
  steamCount = 3,
}: {
  className?: string
  smiling?: boolean
  sleepy?: boolean
  steamCount?: number
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* steam */}
      {Array.from({ length: steamCount }).map((_, i) => {
        const x = 36 + i * 16
        return (
          <path
            key={i}
            d={`M${x} 28 q 6 -8 0 -16 q -6 -8 0 -16`}
            stroke="#2dc4a3"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={0.65 - i * 0.1}
          />
        )
      })}
      {/* bowl rim ellipse */}
      <ellipse
        cx="60"
        cy="58"
        rx="44"
        ry="6"
        fill="#fff"
        stroke="#1a1f2e"
        strokeWidth="3"
      />
      {/* contents (rice) */}
      <path
        d="M20 58 Q 60 70 100 58 L 100 56 Q 60 50 20 56 Z"
        fill="#ffd166"
        stroke="#1a1f2e"
        strokeWidth="2"
      />
      {/* bowl body */}
      <path
        d="M16 58 Q 18 100 60 102 Q 102 100 104 58"
        fill="#ff5a47"
        stroke="#1a1f2e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* eyes */}
      {sleepy ? (
        <>
          <path
            d="M44 78 q 5 4 10 0"
            stroke="#1a1f2e"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M68 78 q 5 4 10 0"
            stroke="#1a1f2e"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <circle cx="49" cy="78" r="3" fill="#1a1f2e" />
          <circle cx="73" cy="78" r="3" fill="#1a1f2e" />
        </>
      )}
      {/* cheeks */}
      <circle cx="40" cy="86" r="3.5" fill="#fff8f1" opacity="0.8" />
      <circle cx="82" cy="86" r="3.5" fill="#fff8f1" opacity="0.8" />
      {/* mouth */}
      {smiling ? (
        <path
          d="M52 88 Q 61 96 70 88"
          stroke="#1a1f2e"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <path
          d="M54 90 Q 61 94 68 90"
          stroke="#1a1f2e"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  )
}

/* ───────────────────────── TZ-safe time ────────────────────────────── */

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
