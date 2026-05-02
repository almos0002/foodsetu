import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  ChefHat,
  Cookie,
  Heart,
  Leaf,
  LogIn,
  PawPrint,
  Recycle,
  Search,
  Sparkles,
  UserPlus,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { Button } from '../components/ui/Button'
import { roleToDashboard } from '../lib/permissions'
import { listPublicAvailableListingsFn } from '../lib/public-listings-server'
import type { PublicListingRow } from '../lib/public-listings-server'

export const Route = createFileRoute('/')({
  loader: async () => {
    const listings = await listPublicAvailableListingsFn({
      data: { category: 'ALL', limit: 8 },
    }).catch(() => [] as PublicListingRow[])
    return { listings }
  },
  component: Home,
})

const HERO_IMG =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&auto=format&fit=crop&q=80'

const FALLBACK_LISTING_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'

const CATEGORIES: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Utensils, label: 'Hot meals' },
  { icon: Cookie, label: 'Bakery' },
  { icon: Leaf, label: 'Vegetarian' },
  { icon: ChefHat, label: 'Restaurants' },
  { icon: Sparkles, label: 'Catering' },
  { icon: PawPrint, label: 'Animal-safe' },
  { icon: Recycle, label: 'Compost' },
  { icon: Building2, label: 'Hotels' },
]

function Home() {
  const { data: session, isPending } = useSession()
  const { listings } = Route.useLoaderData()
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top nav — clean, no fake search pill */}
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
              to="/listings"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 md:inline-flex"
            >
              Browse listings
            </Link>
            <a
              href="#how"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 lg:inline-flex"
            >
              How it works
            </a>
            <a
              href="#partners"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 lg:inline-flex"
            >
              For partners
            </a>
            {!isPending && user ? (
              <Link to={roleToDashboard(user.role)}>
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Open dashboard
                </Button>
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
                  <Button leftIcon={<UserPlus className="h-4 w-4" />}>
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero with REAL CTAs (no fake search pill) */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={HERO_IMG}
              alt="Surplus food laid out"
              className="h-[420px] w-full object-cover sm:h-[500px] lg:h-[580px]"
            />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-0 flex flex-col items-start justify-end p-6 sm:p-10 lg:p-14">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" />
                  Surplus food, redistributed
                </div>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Find the food
                  <br />
                  before it&apos;s wasted.
                </h1>
                <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
                  Restaurants post surplus meals nearby. NGOs and animal rescues
                  claim them in minutes — fresh, free, and verified.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/listings">
                  <Button
                    size="lg"
                    leftIcon={<Search className="h-4 w-4" />}
                    className="h-12 px-6 text-sm"
                  >
                    Browse listings
                  </Button>
                </Link>
                {user ? (
                  <Link to={roleToDashboard(user.role)}>
                    <Button
                      size="lg"
                      variant="outline"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      className="h-12 border-white/40 bg-white/10 px-6 text-sm text-white backdrop-blur hover:bg-white/20"
                    >
                      Open dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/register">
                    <Button
                      size="lg"
                      variant="outline"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                      className="h-12 border-white/40 bg-white/10 px-6 text-sm text-white backdrop-blur hover:bg-white/20"
                    >
                      Sign up — it&apos;s free
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category strip — visual only, honest */}
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="scrollbar-hide flex gap-8 overflow-x-auto py-5">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <Link
                key={label}
                to="/listings"
                className="group flex min-w-[64px] flex-shrink-0 flex-col items-center gap-2 border-b-2 border-transparent pb-3 text-xs font-medium text-gray-500 hover:border-orange-500 hover:text-gray-900"
              >
                <Icon className="h-6 w-6" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings — REAL data */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Surplus available right now
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">
                {listings.length > 0
                  ? `${listings.length} listing${listings.length === 1 ? '' : 's'} live across our partner kitchens.`
                  : 'No live listings yet — be the first to post or sign up to get notified.'}
              </p>
            </div>
            <Link
              to="/listings"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline"
            >
              See all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {listings.length > 0 ? (
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {listings.slice(0, 4).map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <Utensils className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No live listings right now
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Restaurant partners post surplus throughout the day.
              </p>
              <Link to="/register" className="mt-4 inline-block">
                <Button leftIcon={<UserPlus className="h-4 w-4" />}>
                  Become a partner
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-gray-50" id="impact">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-10">
          <Stat label="Meals rescued" value="12,480" hint="Last 12 months" />
          <Stat label="Partner orgs" value="184" hint="Across 38 cities" />
          <Stat label="Avg pickup" value="2h 14m" hint="Post → handover" />
          <Stat label="Waste avoided" value="6.2t" hint="Estimated CO₂e" />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
              How it works
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              From kitchen to community in three steps
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <StepCard
              n="01"
              tone="bg-orange-100 text-orange-700"
              title="Restaurants post"
              body="Pick a category, set quantity and pickup window. Listings go live in seconds."
            />
            <StepCard
              n="02"
              tone="bg-emerald-100 text-emerald-700"
              title="Partners claim"
              body="Verified NGOs and rescues see nearby food in real time and reserve with one tap."
            />
            <StepCard
              n="03"
              tone="bg-blue-100 text-blue-700"
              title="Pickup confirmed"
              body="Both sides confirm handover. Every step is logged for compliance and impact reporting."
            />
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="partners" className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
              Built for everyone in the chain
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              One platform, three workflows
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <RoleCard
              icon={Utensils}
              tone="text-orange-700"
              tag="For restaurants"
              title="Turn surplus into impact, not landfill"
              body="Post listings in seconds. Approve claims. Track every pickup with a full audit trail."
              img="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&auto=format&fit=crop&q=80"
            />
            <RoleCard
              icon={Sparkles}
              tone="text-blue-700"
              tag="For NGOs & shelters"
              title="Reliable, fresh meals — sourced nearby"
              body="Discover human-safe surplus near you. Claim, get directions, and confirm handover."
              img="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&auto=format&fit=crop&q=80"
            />
            <RoleCard
              icon={Heart}
              tone="text-emerald-700"
              tag="For animal rescues"
              title="Animal-safe scraps that would otherwise be wasted"
              body="Filter for animal-safe categories, coordinate around routes, and reduce feed costs."
              img="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop&q=80"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-gray-900 text-white">
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="p-8 sm:p-10 lg:p-14">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-300">
                  Ready when you are
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Start rescuing surplus food in your city today.
                </h2>
                <p className="mt-3 max-w-md text-sm text-gray-300 sm:text-base">
                  Free for restaurants and verified non-profits. No card
                  required. Up and running in minutes.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/register">
                    <Button
                      size="lg"
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Create an account
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/30 bg-transparent text-white hover:bg-white/10"
                    >
                      Sign in
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <img
                  src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop&q=80"
                  alt="Fresh produce"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <div className="text-base font-bold">FoodSetu</div>
              <div className="text-xs text-gray-500">
                © {new Date().getFullYear()} — A bridge between kitchens and
                communities.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <Link to="/listings" className="hover:text-gray-900">
              Browse listings
            </Link>
            <a href="#how" className="hover:text-gray-900">
              How it works
            </a>
            <a href="#partners" className="hover:text-gray-900">
              Partners
            </a>
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

function ListingCard({ item }: { item: PublicListingRow }) {
  const tone =
    item.foodCategory === 'ANIMAL_SAFE'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-emerald-100 text-emerald-700'
  const label =
    item.foodCategory === 'ANIMAL_SAFE' ? 'Animal-safe' : 'Human-safe'

  const pickup = formatPickup(item.pickupStartTime, item.pickupEndTime)
  const subtitle =
    item.cityName ?? item.orgName ?? 'Pickup location confirmed on claim'

  return (
    <Link
      to="/listings"
      className="group block overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={item.imageUrl ?? FALLBACK_LISTING_IMG}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}
        >
          {label}
        </span>
      </div>
      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">
              {subtitle}
            </div>
            <div className="truncate text-sm text-gray-500">{item.title}</div>
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          <span className="font-medium text-gray-900 tabular-nums">
            {item.quantity} {item.quantityUnit.toLowerCase()}
          </span>{' '}
          · {pickup}
        </div>
      </div>
    </Link>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-sm text-gray-500">{hint}</div>
    </div>
  )
}

function StepCard({
  n,
  tone,
  title,
  body,
}: {
  n: string
  tone: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-7">
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-semibold tabular-nums ${tone}`}
      >
        {n}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
    </div>
  )
}

function RoleCard({
  icon: Icon,
  tone,
  tag,
  title,
  body,
  img,
}: {
  icon: LucideIcon
  tone: string
  tag: string
  title: string
  body: string
  img: string
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-gray-300">
      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div
          className={`inline-flex items-center gap-2 text-xs font-semibold ${tone}`}
        >
          <Icon className="h-4 w-4" />
          {tag}
        </div>
        <h3 className="mt-3 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 flex-1 text-sm text-gray-600">{body}</p>
        <Link
          to="/register"
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline"
        >
          Learn more
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function formatPickup(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const now = new Date()
  const sameDay = start.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = start.toDateString() === tomorrow.toDateString()
  const dayLabel = sameDay
    ? 'Today'
    : isTomorrow
      ? 'Tomorrow'
      : start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${dayLabel} · ${fmt(start)} – ${fmt(end)}`
}
