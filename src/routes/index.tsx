import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  ChefHat,
  Cookie,
  Heart,
  Leaf,
  LogIn,
  MapPin,
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

export const Route = createFileRoute('/')({ component: Home })

const HERO_IMG =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&auto=format&fit=crop&q=80'

type Listing = {
  img: string
  city: string
  title: string
  meals: string
  pickup: string
  type: string
  tone: 'orange' | 'green' | 'blue'
}

const FEATURED: Listing[] = [
  {
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    city: 'Mumbai · Bandra West',
    title: 'Wood-fired pizzas, 14 portions',
    meals: '14 servings',
    pickup: 'Today · 4:30 – 6:00 PM',
    type: 'Human-safe',
    tone: 'green',
  },
  {
    img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    city: 'Pune · Koregaon Park',
    title: 'Dal makhani & jeera rice',
    meals: '32 servings',
    pickup: 'Today · 9:00 – 10:30 PM',
    type: 'Human-safe',
    tone: 'green',
  },
  {
    img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80',
    city: 'Bangalore · Indiranagar',
    title: 'Bakery surplus — pastries',
    meals: '40 pieces',
    pickup: 'Tomorrow · 7:30 AM',
    type: 'Human-safe',
    tone: 'orange',
  },
  {
    img: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&auto=format&fit=crop&q=80',
    city: 'Delhi · Connaught Place',
    title: 'Catering scraps · animal-safe',
    meals: '18 kg',
    pickup: 'Today · 11:00 PM',
    type: 'Animal-safe',
    tone: 'blue',
  },
]

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
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white">
              <Utensils className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">FoodSetu</span>
          </Link>

          {/* Pill search (desktop) */}
          <div className="mx-auto hidden lg:block">
            <button
              type="button"
              className="flex items-center divide-x divide-gray-200 rounded-full border border-gray-200 bg-white py-1.5 pl-6 pr-1.5 text-sm font-medium text-gray-700 transition-shadow hover:shadow-sm"
            >
              <span className="pr-4">Anywhere</span>
              <span className="px-4">Any meal</span>
              <span className="pl-4 pr-3 text-gray-400">Add filters</span>
              <span className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white">
                <Search className="h-4 w-4" />
              </span>
            </button>
          </div>

          <nav className="ml-auto flex items-center gap-2">
            <a
              href="#how"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 md:inline-flex"
            >
              How it works
            </a>
            <a
              href="#partners"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 md:inline-flex"
            >
              Become a partner
            </a>
            {isPending ? null : user ? (
              <Link to={roleToDashboard(user.role)}>
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
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

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-10 lg:pb-16 lg:pt-12">
          <div className="relative overflow-hidden rounded-3xl">
            <img
              src={HERO_IMG}
              alt="Surplus food laid out"
              className="h-[440px] w-full object-cover sm:h-[520px] lg:h-[600px]"
            />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex flex-col items-start justify-end p-6 sm:p-10 lg:p-16">
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

              {/* Hero search pill */}
              <div className="mt-6 w-full max-w-3xl">
                <div className="flex flex-col items-stretch gap-2 rounded-2xl bg-white p-2 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5">
                  <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-gray-50 sm:rounded-full">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                        Where
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        City or neighbourhood
                      </div>
                    </div>
                  </div>
                  <div className="hidden h-8 w-px bg-gray-200 sm:block" />
                  <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-gray-50 sm:rounded-full">
                    <Utensils className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                        What
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        Any meal · vegetarian · animal-safe
                      </div>
                    </div>
                  </div>
                  <Link
                    to={user ? roleToDashboard(user.role) : '/register'}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-orange-700 sm:rounded-full"
                  >
                    <Search className="h-4 w-4" />
                    Search
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="scrollbar-hide flex gap-8 overflow-x-auto py-5">
            {CATEGORIES.map(({ icon: Icon, label }, i) => (
              <button
                key={label}
                type="button"
                className={`group flex min-w-[64px] flex-shrink-0 flex-col items-center gap-2 border-b-2 pb-3 text-xs font-medium ${
                  i === 0
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Surplus near you, today
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">
                A glimpse of what kitchens have posted in the last few hours.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline"
            >
              See all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURED.map((item) => (
              <ListingCard key={item.title} item={item} />
            ))}
          </div>
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
                Built for everyone in the chain
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                One platform, three workflows
              </h2>
            </div>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-white">
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
            <a href="#how" className="hover:text-gray-900">
              How it works
            </a>
            <a href="#partners" className="hover:text-gray-900">
              Partners
            </a>
            <a href="#impact" className="hover:text-gray-900">
              Impact
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

function ListingCard({ item }: { item: Listing }) {
  const TYPE_TONE: Record<Listing['tone'], string> = {
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
  }
  return (
    <Link
      to="/register"
      className="group block overflow-hidden rounded-2xl transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
        <img
          src={item.img}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TYPE_TONE[item.tone]}`}
        >
          {item.type}
        </span>
      </div>
      <div className="px-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">
              {item.city}
            </div>
            <div className="truncate text-sm text-gray-500">{item.title}</div>
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          <span className="font-medium text-gray-900 tabular-nums">
            {item.meals}
          </span>{' '}
          · {item.pickup}
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
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
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
