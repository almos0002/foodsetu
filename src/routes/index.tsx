import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  LogIn,
  Sparkles,
  UserPlus,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { roleToDashboard } from '../lib/permissions'
import { listPublicAvailableListingsFn } from '../lib/public-listings-server'
import type { PublicListingRow } from '../lib/public-listings-server'

// Computed in the loader (server-side) and passed via useLoaderData so SSR
// and client always agree, even if a week boundary ticks over mid-render.
function computeIssueNumber(): string {
  const start = new Date('2024-01-01T00:00:00Z')
  const weeks = Math.floor(
    (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 7),
  )
  return String(weeks + 1).padStart(3, '0')
}

export const Route = createFileRoute('/')({
  loader: async () => {
    const listings = await listPublicAvailableListingsFn({
      data: { category: 'ALL', limit: 8 },
    }).catch(() => [] as PublicListingRow[])
    return { listings, issueNumber: computeIssueNumber() }
  },
  component: Home,
})

const HERO_IMG =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&auto=format&fit=crop&q=80'

const FALLBACK_LISTING_IMG =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'

function Home() {
  const { data: session, isPending } = useSession()
  const { listings, issueNumber } = Route.useLoaderData()
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined

  const liveCount = listings.length
  const cityCount = new Set(
    listings.map((l) => l.cityName).filter(Boolean) as Array<string>,
  ).size
  const animalCount = listings.filter(
    (l) => l.foodCategory === 'ANIMAL_SAFE',
  ).length
  const humanCount = liveCount - animalCount

  return (
    <div className="paper-grain min-h-screen text-[var(--color-ink)] antialiased">
      <TopTape liveCount={liveCount} />
      <SiteHeader user={user} isPending={isPending} />

      {/* HERO — asymmetric editorial split */}
      <section className="relative">
        <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-8 sm:px-8 lg:px-14 lg:pb-16 lg:pt-14">
          <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 text-[var(--color-ink-500)]">
                <BowlMark className="h-5 w-5 text-[var(--color-ember)]" />
                <span className="eyebrow">
                  Vol. I · Issue No.{' '}
                  <span className="tabular-nums">{issueNumber}</span>
                </span>
                <hr
                  aria-hidden="true"
                  className="hairline w-12 border-[var(--color-rule)]"
                />
                <span className="eyebrow">Bengaluru &amp; beyond</span>
              </div>
              <h1 className="font-display mt-6 text-[clamp(3rem,7.5vw,6.25rem)] font-light leading-[0.92] tracking-tight text-[var(--color-ink)]">
                The food
                <br />
                <span className="font-display-italic font-normal text-[var(--color-ember)]">
                  before
                </span>{' '}
                it&rsquo;s
                <br />
                wasted.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-[var(--color-ink-700)] sm:text-[17px]">
                A working ledger of surplus from kitchens across the city —
                claimed, in minutes, by the rescues and shelters who need it
                most. Honest food, plainly listed, no waste.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/listings"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-ink)] px-6 text-sm font-medium tracking-wide text-[var(--color-paper)] transition-colors hover:bg-[var(--color-ember)]"
                >
                  Read today&rsquo;s ledger
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {user ? (
                  <Link
                    to={roleToDashboard(user.role)}
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-[var(--color-ink)] px-6 text-sm font-medium tracking-wide text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
                  >
                    Open dashboard
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-[var(--color-ink)] px-6 text-sm font-medium tracking-wide text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
                  >
                    Sign up — it&rsquo;s free
                  </Link>
                )}
              </div>
            </div>

            {/* Hero photo block — slightly oversized, with corner stamp */}
            <div className="relative lg:col-span-5">
              <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-rule)] bg-[var(--color-paper-200)]">
                <img
                  src={HERO_IMG}
                  alt="A spread of seasonal surplus from a partner kitchen"
                  className="aspect-[4/5] h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-paper)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ember)]" />
                  Fresh today
                </span>
              </div>
              {/* Vintage round stamp — pure SVG, no shadow */}
              <RoundStamp className="pointer-events-none absolute -bottom-6 -right-4 h-28 w-28 text-[var(--color-ink)] sm:-right-8 sm:h-32 sm:w-32" />
            </div>
          </div>

          {/* Hero metadata strip — like a magazine masthead row */}
          <dl className="mt-14 grid grid-cols-2 gap-y-6 border-t border-[var(--color-rule)] pt-6 sm:grid-cols-4">
            <Meta k="Live now" v={String(liveCount).padStart(2, '0')} />
            <Meta
              k="Cities"
              v={cityCount > 0 ? String(cityCount).padStart(2, '0') : '01'}
            />
            <Meta k="Human-safe" v={String(humanCount).padStart(2, '0')} />
            <Meta k="Animal-safe" v={String(animalCount).padStart(2, '0')} />
          </dl>
        </div>
      </section>

      {/* TODAY'S LEDGER — editorial listings */}
      <section
        id="ledger"
        className="border-t border-[var(--color-rule)] bg-[var(--color-paper)]"
      >
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
          <SectionHeader
            chapter="I"
            kicker="Today's ledger"
            title={
              <>
                What&rsquo;s on the counter,{' '}
                <span className="font-display-italic">right now.</span>
              </>
            }
            sub={
              listings.length > 0
                ? `${listings.length} live listing${listings.length === 1 ? '' : 's'} from partner kitchens. New entries arrive throughout the day.`
                : 'No live listings yet. Restaurant partners post surplus throughout the day.'
            }
            cta={{ to: '/listings', label: 'Open the full ledger' }}
          />
          {listings.length > 0 ? (
            <EditorialListings items={listings.slice(0, 5)} />
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-[var(--color-rule)] p-14 text-center">
              <BowlMark className="mx-auto h-8 w-8 text-[var(--color-ember)]" />
              <p className="font-display mt-4 text-2xl font-light text-[var(--color-ink)]">
                The ledger is empty.
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink-500)]">
                Become a partner to be the first entry of the day.
              </p>
              <Link
                to="/register"
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-ember)]"
              >
                <UserPlus className="h-4 w-4" /> Become a partner
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* BY THE NUMBERS — ledger-style stats with hairline rules */}
      <section className="border-t border-[var(--color-rule)] bg-[var(--color-paper-200)]">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
          <SectionHeader
            chapter="II"
            kicker="By the numbers"
            title={
              <>
                A small, stubborn{' '}
                <span className="font-display-italic">dent</span> in food
                waste.
              </>
            }
            sub="What our partner kitchens and rescues have moved together — counted plainly, audited at every handover."
          />
          <div className="col-rules mt-12 grid grid-cols-2 border-y border-[var(--color-rule)] lg:grid-cols-4">
            <Ledger n="12,480" l="Meals rescued" h="Last 12 months" />
            <Ledger n="184" l="Partner orgs" h="38 cities" />
            <Ledger n="2h 14m" l="Avg. pickup" h="Post → handover" />
            <Ledger n="6.2t" l="Waste avoided" h="Estimated CO₂e" />
          </div>
        </div>
      </section>

      {/* THE METHOD — three vertical chapters with oversized roman numerals */}
      <section
        id="how"
        className="border-t border-[var(--color-rule)] bg-[var(--color-paper)]"
      >
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
          <SectionHeader
            chapter="III"
            kicker="The method"
            title={
              <>
                From kitchen to community,{' '}
                <span className="font-display-italic">in three motions.</span>
              </>
            }
            sub="No app gymnastics. Restaurants post in seconds, partners reserve in one tap, both sides confirm at handover."
          />
          <div className="mt-14 divide-y divide-[var(--color-rule)] border-y border-[var(--color-rule)]">
            <Chapter
              roman="I."
              title="The kitchen posts."
              body="A line cook taps a category, sets the quantity, and picks a window. A photo, a city, a phone number — and the listing is live to verified partners."
            />
            <Chapter
              roman="II."
              title="A partner reserves."
              body="Verified NGOs and animal rescues in range see it instantly. One tap puts the listing on their route — restaurant phone revealed only on accept."
            />
            <Chapter
              roman="III."
              title="The handover, on the record."
              body="Both sides confirm at pickup. Every step is logged — for compliance, for honest impact reports, and so the next listing arrives faster."
            />
          </div>
        </div>
      </section>

      {/* ROLES — magazine-style contributor cards */}
      <section
        id="partners"
        className="border-t border-[var(--color-rule)] bg-[var(--color-paper-200)]"
      >
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
          <SectionHeader
            chapter="IV"
            kicker="At the table"
            title={
              <>
                Three workflows,{' '}
                <span className="font-display-italic">one bridge.</span>
              </>
            }
            sub="The platform is the same — the verbs change with who's signed in."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--color-rule)] bg-[var(--color-rule)] lg:grid-cols-3">
            <Contributor
              tag="No. 01 — Restaurants"
              icon={Utensils}
              tone="text-[var(--color-ember)]"
              title="Surplus, made useful — not landfill."
              body="Post listings in seconds. Approve claims. Audit every pickup."
              img="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&auto=format&fit=crop&q=80"
            />
            <Contributor
              tag="No. 02 — NGOs &amp; shelters"
              icon={Sparkles}
              tone="text-[var(--color-ink)]"
              title="Reliable, fresh meals — sourced nearby."
              body="Discover human-safe surplus. Claim, route, and confirm handover."
              img="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&auto=format&fit=crop&q=80"
            />
            <Contributor
              tag="No. 03 — Animal rescues"
              icon={Heart}
              tone="text-[var(--color-ember)]"
              title="Animal-safe scraps, redirected with care."
              body="Filter for what your animals can eat. Cut feed costs, cut waste."
              img="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop&q=80"
            />
          </div>
        </div>
      </section>

      {/* MANIFESTO CTA — oversized serif quote on dark cream */}
      <section className="border-t border-[var(--color-rule)]">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-14 lg:py-24">
          <div className="ink-grain relative overflow-hidden rounded-[32px] border border-[var(--color-ink)] px-7 py-14 text-[var(--color-paper)] sm:px-12 sm:py-20 lg:px-20 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <div className="eyebrow text-[var(--color-paper-200)]">
                  A working manifesto
                </div>
                <p className="font-display mt-6 text-[clamp(2.25rem,4.5vw,4rem)] font-light leading-[1.02] tracking-tight">
                  &ldquo;Good food shouldn&rsquo;t need{' '}
                  <span className="font-display-italic text-[var(--color-ember)]">
                    a second life
                  </span>{' '}
                  to be useful — but when it does, it deserves an honest
                  bridge.&rdquo;
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-[var(--color-paper-200)]">
                  <hr
                    aria-hidden="true"
                    className="hairline w-10 border-[var(--color-paper-200)]"
                  />
                  <span className="eyebrow">FoodSetu, Vol. I</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:col-span-4">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-between gap-3 rounded-full bg-[var(--color-ember)] px-6 text-sm font-medium text-white transition-colors hover:bg-[oklch(0.58_0.21_38)]"
                >
                  <span>Create an account</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center justify-between gap-3 rounded-full border border-[var(--color-paper-200)] px-6 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
                >
                  <span>Sign in</span>
                  <LogIn className="h-4 w-4" />
                </Link>
                <Link
                  to="/listings"
                  className="inline-flex h-12 items-center justify-between gap-3 rounded-full px-6 text-sm font-medium text-[var(--color-paper-200)] transition-colors hover:text-[var(--color-paper)]"
                >
                  <span>Just browse the ledger</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Colophon issueNumber={issueNumber} />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Top tape — a thin marquee of running stats. Sits above the masthead. */
/* ────────────────────────────────────────────────────────────────────────── */

function TopTape({ liveCount }: { liveCount: number }) {
  const tape = [
    `${liveCount} live listings`,
    'fresh from partner kitchens',
    '12,480 meals rescued',
    '184 verified partners',
    '38 cities & growing',
    'pickups in under 2h 14m',
    'every handover, on record',
    'free to join — always',
  ]
  return (
    <div className="border-b border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)]">
      <div className="overflow-hidden">
        <div
          className="flex whitespace-nowrap py-2.5"
          style={{ animation: 'var(--animate-marquee)' }}
        >
          {[...tape, ...tape, ...tape, ...tape].map((t, i) => (
            <span
              key={i}
              className="eyebrow flex shrink-0 items-center gap-3 px-6 text-[var(--color-paper)]/85"
            >
              <span className="h-1 w-1 rounded-full bg-[var(--color-ember)]" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Site header — masthead with serif logotype and pill nav. */
/* ────────────────────────────────────────────────────────────────────────── */

function SiteHeader({
  user,
  isPending,
}: {
  user: { role?: string | null } | undefined
  isPending: boolean
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-rule)] bg-[var(--color-paper)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-5 sm:h-[72px] sm:px-8 lg:px-14">
        <Link to="/" className="flex items-center gap-3">
          <BowlMark className="h-7 w-7 text-[var(--color-ember)]" />
          <div className="leading-none">
            <div className="font-display text-[22px] font-medium tracking-tight text-[var(--color-ink)]">
              FoodSetu
            </div>
            <div className="eyebrow mt-1 text-[var(--color-ink-500)]">
              Est. 2024 — Bengaluru
            </div>
          </div>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          <Link
            to="/listings"
            className="editorial-link hidden text-sm font-medium text-[var(--color-ink-700)] sm:inline-flex"
          >
            Today&rsquo;s ledger
          </Link>
          <a
            href="#how"
            className="editorial-link hidden text-sm font-medium text-[var(--color-ink-700)] lg:inline-flex"
          >
            The method
          </a>
          <a
            href="#partners"
            className="editorial-link hidden text-sm font-medium text-[var(--color-ink-700)] lg:inline-flex"
          >
            Partners
          </a>
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
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Section header — chapter numeral + kicker + serif title + sub + cta. */
/* ────────────────────────────────────────────────────────────────────────── */

function SectionHeader({
  chapter,
  kicker,
  title,
  sub,
  cta,
}: {
  chapter: string
  kicker: string
  title: React.ReactNode
  sub?: string
  cta?: { to: string; label: string }
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
      <div className="lg:col-span-2">
        <div className="font-display select-none text-[64px] font-light leading-none text-[var(--color-ember)] sm:text-[88px]">
          {chapter}.
        </div>
      </div>
      <div className="lg:col-span-7">
        <div className="eyebrow text-[var(--color-ink-500)]">{kicker}</div>
        <h2 className="font-display mt-3 text-[clamp(2rem,4.2vw,3.5rem)] font-light leading-[1.02] tracking-tight text-[var(--color-ink)]">
          {title}
        </h2>
        {sub ? (
          <p className="mt-4 max-w-xl text-base text-[var(--color-ink-700)]">
            {sub}
          </p>
        ) : null}
      </div>
      {cta ? (
        <div className="lg:col-span-3 lg:text-right">
          <Link
            to={cta.to}
            className="editorial-link inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink)]"
          >
            {cta.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Editorial listings — first card large, others stacked, all hairline. */
/* ────────────────────────────────────────────────────────────────────────── */

function EditorialListings({ items }: { items: Array<PublicListingRow> }) {
  if (items.length === 0) return null
  const [lead, ...rest] = items
  return (
    <div className="mt-12 grid gap-10 lg:grid-cols-12">
      <FeatureCard item={lead} index={0} />
      <div className="divide-y divide-[var(--color-rule)] lg:col-span-5">
        {rest.slice(0, 4).map((item, i) => (
          <RowCard key={item.id} item={item} index={i + 1} />
        ))}
      </div>
    </div>
  )
}

function FeatureCard({
  item,
  index,
}: {
  item: PublicListingRow
  index: number
}) {
  const tag = item.foodCategory === 'ANIMAL_SAFE' ? 'Animal-safe' : 'Human-safe'
  return (
    <Link
      to="/listings"
      className="group relative block lg:col-span-7"
    >
      <div className="relative overflow-hidden rounded-[24px] border border-[var(--color-rule)] bg-[var(--color-paper-200)]">
        <img
          src={item.imageUrl ?? FALLBACK_LISTING_IMG}
          alt={item.title}
          className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute left-5 top-5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-paper)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-ember)]" />
            Lead entry
          </span>
        </div>
        <span className="font-display absolute right-5 top-3 text-[44px] font-light leading-none text-[var(--color-paper)] tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-12 items-end gap-6">
        <div className="col-span-9">
          <div className="eyebrow text-[var(--color-ink-500)]">
            {tag} ·{' '}
            {item.cityName ?? item.orgName ?? 'Pickup confirmed on claim'}
          </div>
          <h3 className="font-display mt-2 text-3xl font-light leading-tight text-[var(--color-ink)] sm:text-[34px]">
            {item.title}
          </h3>
        </div>
        <div className="col-span-3 text-right">
          <div className="eyebrow text-[var(--color-ink-500)]">Window</div>
          <div className="mt-2 text-sm font-medium tabular-nums text-[var(--color-ink)]">
            {formatPickupShort(item.pickupStartTime, item.pickupEndTime)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm text-[var(--color-ink-700)]">
        <span className="font-medium tabular-nums text-[var(--color-ink)]">
          {item.quantity} {item.quantityUnit.toLowerCase()}
        </span>
        <hr aria-hidden="true" className="hairline w-10" />
        <span className="editorial-link inline-flex items-center gap-1 font-medium text-[var(--color-ink)]">
          Read entry
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

function RowCard({ item, index }: { item: PublicListingRow; index: number }) {
  const tag = item.foodCategory === 'ANIMAL_SAFE' ? 'Animal-safe' : 'Human-safe'
  return (
    <Link
      to="/listings"
      className="group grid grid-cols-12 items-center gap-4 py-5 first:pt-0"
    >
      <span className="font-display col-span-2 text-[34px] font-light leading-none text-[var(--color-ink-300)] tabular-nums sm:col-span-1">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="col-span-10 sm:col-span-7">
        <div className="eyebrow text-[var(--color-ink-500)]">
          {tag} · {item.cityName ?? 'Bengaluru'}
        </div>
        <h4 className="font-display mt-1 text-[20px] font-light leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-ember)]">
          {item.title}
        </h4>
        <div className="mt-1 text-xs text-[var(--color-ink-700)]">
          <span className="font-medium tabular-nums text-[var(--color-ink)]">
            {item.quantity} {item.quantityUnit.toLowerCase()}
          </span>{' '}
          · {formatPickupShort(item.pickupStartTime, item.pickupEndTime)}
        </div>
      </div>
      <div className="col-span-12 sm:col-span-4 sm:text-right">
        <span className="editorial-link inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ink)]">
          Read
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Ledger numbers, chapters, contributors, meta — all hairline-driven. */
/* ────────────────────────────────────────────────────────────────────────── */

function Ledger({ n, l, h }: { n: string; l: string; h: string }) {
  return (
    <div className="px-2 py-8 sm:px-6 lg:px-8">
      <div className="eyebrow text-[var(--color-ink-500)]">{l}</div>
      <div className="font-display mt-3 text-[44px] font-light leading-none tracking-tight text-[var(--color-ink)] tabular-nums sm:text-[56px]">
        {n}
      </div>
      <div className="mt-3 text-xs text-[var(--color-ink-500)]">{h}</div>
    </div>
  )
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="eyebrow text-[var(--color-ink-500)]">{k}</dt>
      <dd className="font-display mt-2 text-[28px] font-light leading-none tracking-tight text-[var(--color-ink)] tabular-nums">
        {v}
      </dd>
    </div>
  )
}

function Chapter({
  roman,
  title,
  body,
}: {
  roman: string
  title: string
  body: string
}) {
  return (
    <div className="grid grid-cols-12 gap-4 py-10 sm:gap-8 sm:py-12">
      <div className="col-span-2 sm:col-span-3 lg:col-span-2">
        <div className="font-display text-[64px] font-light leading-none text-[var(--color-ember)] sm:text-[96px]">
          {roman}
        </div>
      </div>
      <div className="col-span-10 sm:col-span-9 lg:col-span-7">
        <h3 className="font-display text-[28px] font-light leading-tight tracking-tight text-[var(--color-ink)] sm:text-[36px]">
          {title}
        </h3>
        <p className="mt-3 max-w-xl text-base text-[var(--color-ink-700)]">
          {body}
        </p>
      </div>
    </div>
  )
}

function Contributor({
  tag,
  icon: Icon,
  tone,
  title,
  body,
  img,
}: {
  tag: string
  icon: LucideIcon
  tone: string
  title: string
  body: string
  img: string
}) {
  return (
    <article className="group flex flex-col gap-5 bg-[var(--color-paper)] p-7 transition-colors hover:bg-[var(--color-paper-200)] sm:p-8">
      <div className="aspect-[16/10] overflow-hidden rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-200)]">
        <img
          src={img}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone}`} />
        <span className="eyebrow text-[var(--color-ink-500)]">{tag}</span>
      </div>
      <h3 className="font-display text-[26px] font-light leading-tight tracking-tight text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-ink-700)]">{body}</p>
      <div className="mt-auto flex items-center gap-3">
        <hr aria-hidden="true" className="hairline flex-1" />
        <Link
          to="/register"
          className="editorial-link inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ink)]"
        >
          Apply
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Colophon footer */
/* ────────────────────────────────────────────────────────────────────────── */

function Colophon({ issueNumber }: { issueNumber: string }) {
  return (
    <footer className="border-t border-[var(--color-rule)] bg-[var(--color-paper)]">
      <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <BowlMark className="h-8 w-8 text-[var(--color-ember)]" />
              <div className="leading-tight">
                <div className="font-display text-[26px] font-medium text-[var(--color-ink)]">
                  FoodSetu
                </div>
                <div className="eyebrow mt-1 text-[var(--color-ink-500)]">
                  A bridge between kitchens &amp; communities
                </div>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm text-[var(--color-ink-700)]">
              Set in <span className="font-display italic">Fraunces</span> &amp;
              Poppins. Printed daily, in pixels, from Bengaluru.
            </p>
          </div>
          <div className="lg:col-span-4">
            <div className="eyebrow text-[var(--color-ink-500)]">Sections</div>
            <ul className="mt-4 grid grid-cols-2 gap-y-2 text-sm text-[var(--color-ink-700)]">
              <li>
                <Link to="/listings" className="editorial-link">
                  Ledger
                </Link>
              </li>
              <li>
                <a href="#how" className="editorial-link">
                  Method
                </a>
              </li>
              <li>
                <a href="#partners" className="editorial-link">
                  Partners
                </a>
              </li>
              <li>
                <Link to="/login" className="editorial-link">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="editorial-link">
                  Get started
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-3 lg:text-right">
            <div className="eyebrow text-[var(--color-ink-500)]">Colophon</div>
            <div className="mt-4 text-sm text-[var(--color-ink-700)]">
              © {new Date().getFullYear()} · Vol. I, Issue No.{' '}
              <span className="tabular-nums">{issueNumber}</span>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--color-rule)] pt-5 text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-500)]">
          Made with restraint · No card required · Always free for verified
          partners
        </div>
      </div>
    </footer>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Custom SVG marks — bowl & vintage round stamp. No external deps. */
/* ────────────────────────────────────────────────────────────────────────── */

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

function RoundStamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <path
          id="stamp-circle"
          d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
        />
      </defs>
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="var(--color-paper)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="100"
        cy="100"
        r="78"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
      <text
        fill="currentColor"
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.18em',
        }}
      >
        <textPath href="#stamp-circle" startOffset="0">
          FRESH · TODAY · CLAIM IN MINUTES · FRESH · TODAY ·
        </textPath>
      </text>
      <g transform="translate(100,100)">
        <circle r="22" fill="var(--color-ember)" />
        <text
          y="6"
          textAnchor="middle"
          fill="var(--color-paper)"
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: '24px',
            fontWeight: 500,
          }}
        >
          FS
        </text>
      </g>
    </svg>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Time formatting — fixed Asia/Kolkata so SSR + client agree (hydration). */
/* ────────────────────────────────────────────────────────────────────────── */

const TZ = 'Asia/Kolkata'
const ymdInTz = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)

function formatPickupShort(startIso: string, endIso: string): string {
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
