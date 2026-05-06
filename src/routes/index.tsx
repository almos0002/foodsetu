import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Coffee,
  Croissant,
  HeartHandshake,
  Home as HomeIcon,
  LogIn,
  MapPin,
  PawPrint,
  ShieldCheck,
  UserPlus,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
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

/**
 * HeroNetwork
 *
 * Animated visualization of FoodSetu's core loop: real iconography for
 * donors (top) and claimants (bottom), with a single highlighted route
 * cycling through the network. The active route lights up, its endpoints
 * pulse, and a parcel travels along the path. Inactive routes stay as
 * faint grid lines so the topology is always visible.
 */
type HeroNode = {
  x: number
  y: number
  Icon: LucideIcon
}

const VBW = 400
const VBH = 500

type MapLocation = {
  id: string
  x: number
  y: number
  iconId: string
  name: string
  kind: 'donor' | 'claim'
}

// Locations on the FoodSetu mini-map. Coordinates in a 400×500 viewBox.
const LOCATIONS: MapLocation[] = [
  { id: 'L0', x: 70, y: 78, iconId: 'i-bakery', name: 'Bhojan Griha', kind: 'donor' },
  { id: 'L1', x: 220, y: 55, iconId: 'i-hotel', name: 'Hotel Annapurna', kind: 'donor' },
  { id: 'L2', x: 340, y: 118, iconId: 'i-restaurant', name: 'Thakali Kitchen', kind: 'donor' },
  { id: 'L3', x: 55, y: 232, iconId: 'i-cafe', name: 'Himalayan Java', kind: 'donor' },
  { id: 'L4', x: 345, y: 248, iconId: 'i-ngo', name: 'Sarvanam Trust', kind: 'claim' },
  { id: 'L5', x: 200, y: 320, iconId: 'i-shelter', name: 'Hopecare Home', kind: 'claim' },
  { id: 'L6', x: 75, y: 420, iconId: 'i-bowl', name: 'CARE Nepal', kind: 'claim' },
  { id: 'L7', x: 335, y: 412, iconId: 'i-paw', name: 'KAT Centre', kind: 'claim' },
]

// Roads — each is a winding path used both as visual asphalt AND as the
// motion path that delivery parcels follow continuously.
const ROADS = [
  { id: 'r0', d: 'M 70 78 Q 145 60 220 55 Q 290 70 340 118' },
  { id: 'r1', d: 'M 340 118 Q 360 180 345 248 Q 340 330 335 412' },
  { id: 'r2', d: 'M 75 420 Q 205 470 335 412' },
  { id: 'r3', d: 'M 70 78 Q 50 160 55 232 Q 60 330 75 420' },
  { id: 'r4', d: 'M 55 232 Q 200 270 345 248' },
  { id: 'r5', d: 'M 220 55 Q 245 200 200 320 Q 265 380 335 412' },
]

// Highlight cycle — pairs of LOCATIONS ids that take turns being "in transit".
const HIGHLIGHTS: Array<[string, string]> = [
  ['L0', 'L6'],
  ['L1', 'L5'],
  ['L2', 'L4'],
  ['L0', 'L4'],
  ['L1', 'L7'],
  ['L3', 'L5'],
  ['L2', 'L7'],
  ['L3', 'L6'],
]

// All icons share a 24×24 viewBox, stroke-based, currentColor.
const ICON_PATHS: Record<string, React.ReactNode> = {
  'i-bakery': (
    <path d="M4 13c0-5 4-9 9-9 4 0 7 3 7 7s-3 8-8 8c-2 0-3-1-3-3 0-1.5 1.2-3 3-3 1.4 0 2.5 1 2.5 2.5" />
  ),
  'i-hotel': (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h0 M15 7h0 M9 11h0 M15 11h0 M9 15h0 M15 15h0" />
      <path d="M11 19h2" />
    </>
  ),
  'i-restaurant': (
    <>
      <path d="M7 3v18 M5 3v6a2 2 0 0 0 2 2 M9 3v6a2 2 0 0 1-2 2" />
      <path d="M16 3c-1 0-2 1-2 3v5c0 1 1 2 2 2v8 M16 3c1 0 2 1 2 3v5c0 1-1 2-2 2" />
    </>
  ),
  'i-cafe': (
    <>
      <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
      <path d="M16 10h2a2 2 0 0 1 0 4h-2" />
      <path d="M8 3v2 M11 3v2 M14 3v2" />
    </>
  ),
  'i-ngo': (
    <>
      <path d="M12 21s-7-4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 6-7 10-7 10z" />
      <path d="M9 11l3 3 3-3" />
    </>
  ),
  'i-shelter': (
    <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
  ),
  'i-bowl': (
    <>
      <path d="M3 11h18" />
      <path d="M4 11a8 8 0 0 0 16 0" />
      <path d="M12 5v3 M9 6v2 M15 6v2" />
    </>
  ),
  'i-paw': (
    <>
      <circle cx="6" cy="10" r="1.8" />
      <circle cx="10" cy="6" r="1.8" />
      <circle cx="14" cy="6" r="1.8" />
      <circle cx="18" cy="10" r="1.8" />
      <path d="M9 16c0-2 1.5-4 3-4s3 2 3 4-1.5 3-3 3-3-1-3-3z" />
    </>
  ),
}

function HeroNetwork() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const active = HIGHLIGHTS[activeIdx]
  const activeFrom = LOCATIONS.find((l) => l.id === active[0])!
  const activeTo = LOCATIONS.find((l) => l.id === active[1])!

  // Cycle which pair of locations is "in transit".
  useEffect(() => {
    const id = setInterval(
      () => setActiveIdx((i) => (i + 1) % HIGHLIGHTS.length),
      2600,
    )
    return () => clearInterval(id)
  }, [])

  // Mount: parcels flow along roads, cards drop in, roads draw in,
  // breathing loops, compass spins.
  useEffect(() => {
    if (!svgRef.current) return
    let cancelled = false
    const teardown: Array<() => void> = []
    ;(async () => {
      const animeMod: any = await import('animejs')
      if (cancelled || !svgRef.current) return
      const animate = animeMod.animate
      const stagger = animeMod.stagger
      const svgUtil = animeMod.svg
      const root = svgRef.current

      // Roads draw in via stroke-dashoffset.
      const roads = root.querySelectorAll<SVGPathElement>('.mm-road-inner')
      roads.forEach((r, i) => {
        const len = r.getTotalLength()
        r.style.strokeDasharray = String(len)
        r.style.strokeDashoffset = String(len)
        const a = animate(r, {
          strokeDashoffset: [len, 0],
          duration: 1100,
          delay: 60 + i * 70,
          ease: 'outQuad',
        })
        teardown.push(() => a.pause?.())
      })

      // Cards drop in with overshoot.
      const cardWraps = root.querySelectorAll<SVGGElement>('.mm-card')
      cardWraps.forEach((el) => {
        el.style.opacity = '0'
        el.style.transform = 'translateY(-22px) scale(0.6)'
      })
      const cardEntry = animate(cardWraps, {
        translateY: [-22, 0],
        scale: [0.6, 1],
        opacity: [0, 1],
        duration: 760,
        delay: stagger(70, { from: 'center', start: 700 }),
        ease: 'outBack(1.6)',
      })
      teardown.push(() => cardEntry.pause?.())

      // Breathing — subtle continuous Y oscillation, out of phase.
      cardWraps.forEach((el, i) => {
        const a = animate(el, {
          translateY: [
            { to: -2, duration: 2200 + (i % 4) * 240, ease: 'inOutSine' },
            { to: 2, duration: 2200 + (i % 4) * 240, ease: 'inOutSine' },
            { to: 0, duration: 2200 + (i % 4) * 240, ease: 'inOutSine' },
          ],
          loop: true,
          delay: 1600 + i * 180,
        })
        teardown.push(() => a.pause?.())
      })

      // Parcels flow continuously along their road via createMotionPath.
      ROADS.forEach((road, i) => {
        const path = root.querySelector<SVGPathElement>(`#${road.id}-path`)
        const parcel = root.querySelector<SVGGElement>(`#${road.id}-parcel`)
        if (!path || !parcel || !svgUtil?.createMotionPath) return
        const motion = svgUtil.createMotionPath(path)
        const a = animate(parcel, {
          ...motion,
          duration: 8500 + i * 1300,
          loop: true,
          ease: 'linear',
          delay: 900 + i * 420,
        })
        teardown.push(() => a.pause?.())
      })

      // Compass needle slow rotate.
      const needle = root.querySelector<SVGGElement>('.mm-compass-needle')
      if (needle) {
        const a = animate(needle, {
          rotate: [0, 360],
          duration: 22000,
          loop: true,
          ease: 'linear',
        })
        teardown.push(() => a.pause?.())
      }

      // Live-network indicator dot — soft sine breathing on opacity.
      const liveDot = root.querySelector<SVGCircleElement>('.mm-live-dot')
      if (liveDot) {
        const a = animate(liveDot, {
          scale: [1, 1.4, 1],
          opacity: [1, 0.55, 1],
          duration: 1600,
          loop: true,
          ease: 'inOutSine',
        })
        teardown.push(() => a.pause?.())
      }
    })()
    return () => {
      cancelled = true
      teardown.forEach((t) => t())
    }
  }, [])

  // Per-highlight cycle: icon flip, particle burst, floating chip pop.
  useEffect(() => {
    if (!svgRef.current) return
    let cancelled = false
    const anims: Array<{ pause?: () => void }> = []
    ;(async () => {
      const animeMod: any = await import('animejs')
      if (cancelled || !svgRef.current) return
      const animate = animeMod.animate
      const root = svgRef.current

      // Active card icon: rotate + scale pop.
      root
        .querySelectorAll<SVGGElement>('.mm-card-active .mm-card-glyph')
        .forEach((glyph, i) => {
          glyph.style.transformBox = 'fill-box'
          glyph.style.transformOrigin = 'center'
          const a = animate(glyph, {
            rotate: [0, 360],
            scale: [
              { to: 1.32, duration: 260, ease: 'outQuad' },
              { to: 1, duration: 380, ease: 'outBack(2)' },
            ],
            duration: 700,
            delay: i * 90,
          })
          anims.push(a)
        })

      // Active card body: brief lift bounce.
      root
        .querySelectorAll<SVGGElement>('.mm-card-active .mm-card-body')
        .forEach((body, i) => {
          const a = animate(body, {
            translateY: [
              { to: -6, duration: 260, ease: 'outQuad' },
              { to: 0, duration: 460, ease: 'outBack(1.8)' },
            ],
            delay: i * 90,
          })
          anims.push(a)
        })

      // Particle burst from each active card centre.
      const particles = root.querySelectorAll<SVGCircleElement>('.mm-particle')
      const half = particles.length / 2
      particles.forEach((p, i) => {
        const target = i < half ? activeFrom : activeTo
        const k = i % half
        const angle = (Math.PI * 2 * k) / half + Math.random() * 0.6
        const dist = 30 + Math.random() * 18
        p.setAttribute('cx', String(target.x))
        p.setAttribute('cy', String(target.y - 4))
        p.style.opacity = '0'
        p.style.transform = ''
        const a = animate(p, {
          translateX: [0, Math.cos(angle) * dist],
          translateY: [0, Math.sin(angle) * dist - 6],
          opacity: [
            { to: 1, duration: 60 },
            { to: 0, duration: 720 },
          ],
          scale: [
            { from: 1.2, to: 0.3, duration: 780, ease: 'outExpo' },
          ],
          duration: 800,
          ease: 'outExpo',
          delay: 60 + (i % half) * 30,
        })
        anims.push(a)
      })

      // Floating chip pop above active-from card.
      const chip = root.querySelector<SVGGElement>('.mm-chip')
      if (chip) {
        chip.style.opacity = '0'
        const a = animate(chip, {
          opacity: [
            { to: 1, duration: 220, ease: 'outQuad' },
            { to: 0, duration: 520, delay: 1500 },
          ],
          translateY: [10, 0],
          scale: [
            { from: 0.82, to: 1.04, duration: 280, ease: 'outBack(1.6)' },
            { to: 1, duration: 240 },
          ],
          duration: 2400,
        })
        anims.push(a)
      }
    })()
    return () => {
      cancelled = true
      anims.forEach((a) => a.pause?.())
    }
  }, [activeIdx])

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} ${VBH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        style={{ fontFamily: 'inherit' }}
      >
        <defs>
          {Object.entries(ICON_PATHS).map(([id, body]) => (
            <symbol
              key={id}
              id={id}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {body}
            </symbol>
          ))}
          <filter id="mm-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <linearGradient id="mm-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-canvas-2, #f6f4ee)" />
            <stop offset="100%" stopColor="var(--color-canvas, #ece8dd)" />
          </linearGradient>
        </defs>

        {/* Map ground */}
        <rect x="0" y="0" width={VBW} height={VBH} rx="22" fill="url(#mm-bg)" />

        {/* Faint topographic contour rings */}
        <g
          stroke="var(--color-line, #d8d3c5)"
          strokeWidth="0.6"
          fill="none"
          opacity="0.55"
        >
          <ellipse cx="200" cy="250" rx="190" ry="230" />
          <ellipse cx="200" cy="250" rx="150" ry="180" />
          <ellipse cx="200" cy="250" rx="105" ry="125" />
          <ellipse cx="200" cy="250" rx="62" ry="74" />
        </g>

        {/* River / decorative blue ribbon across the map */}
        <path
          d="M -10 380 Q 90 340 175 360 Q 255 380 310 340 Q 360 310 410 330"
          fill="none"
          stroke="#bcd9d6"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M -10 380 Q 90 340 175 360 Q 255 380 310 340 Q 360 310 410 330"
          fill="none"
          stroke="#dfeeec"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Roads — 3-layer asphalt look */}
        {ROADS.map((road) => (
          <g key={road.id}>
            <path
              d={road.d}
              fill="none"
              stroke="rgba(20,20,18,0.85)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.18"
            />
            <path
              id={`${road.id}-path`}
              className="mm-road-inner"
              d={road.d}
              fill="none"
              stroke="#ffffff"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={road.d}
              fill="none"
              stroke="#cdc6b6"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeDasharray="3 6"
              opacity="0.85"
            />
          </g>
        ))}

        {/* Parcels — small delivery vans flowing continuously */}
        {ROADS.map((road) => (
          <g key={`p-${road.id}`} id={`${road.id}-parcel`}>
            <rect
              x="-7.5"
              y="-5"
              width="15"
              height="10"
              rx="2.4"
              fill="var(--color-accent, #d97706)"
            />
            <path
              d="M 7.5 0 L 4 -3.5 L 4 3.5 Z"
              fill="var(--color-accent, #d97706)"
            />
            <rect
              x="-6"
              y="-3.5"
              width="6"
              height="2"
              rx="0.6"
              fill="rgba(255,255,255,0.4)"
            />
            <circle cx="-4" cy="5.5" r="1.3" fill="#1f1d18" />
            <circle cx="4" cy="5.5" r="1.3" fill="#1f1d18" />
          </g>
        ))}

        {/* Particle pool — repositioned per highlight cycle */}
        {Array.from({ length: 14 }).map((_, i) => (
          <circle
            key={`pt-${i}`}
            className="mm-particle"
            cx="0"
            cy="0"
            r="1.8"
            fill="var(--color-accent, #d97706)"
            opacity="0"
          />
        ))}

        {/* Location cards (squircle, NOT circular) */}
        {LOCATIONS.map((loc) => {
          const isActive =
            loc.id === activeFrom.id || loc.id === activeTo.id
          return (
            <g
              key={loc.id}
              transform={`translate(${loc.x} ${loc.y})`}
              style={{ pointerEvents: 'none' }}
            >
              <g className="mm-card" style={{ transformOrigin: '0 0' }}>
                {/* shadow */}
                <ellipse
                  cx="0"
                  cy="24"
                  rx="20"
                  ry="3.5"
                  fill="rgba(0,0,0,0.18)"
                  filter="url(#mm-shadow)"
                  opacity="0.55"
                />
                <g
                  className={`mm-card-body ${
                    isActive ? 'mm-card-active' : ''
                  }`}
                  style={{ transformOrigin: '0 0' }}
                >
                  {/* squircle card */}
                  <rect
                    x="-26"
                    y="-22"
                    width="52"
                    height="40"
                    rx="13"
                    fill={
                      isActive
                        ? 'var(--color-accent, #d97706)'
                        : '#ffffff'
                    }
                    stroke={
                      isActive
                        ? 'var(--color-accent, #d97706)'
                        : 'rgba(20,20,18,0.85)'
                    }
                    strokeWidth={isActive ? 1.6 : 1.4}
                  />
                  {/* tiny pin notch under card */}
                  <path
                    d="M -5 17 L 0 23 L 5 17 Z"
                    fill={
                      isActive
                        ? 'var(--color-accent, #d97706)'
                        : '#ffffff'
                    }
                    stroke={
                      isActive
                        ? 'var(--color-accent, #d97706)'
                        : 'rgba(20,20,18,0.85)'
                    }
                    strokeWidth={isActive ? 1.6 : 1.4}
                    strokeLinejoin="round"
                  />
                  {/* icon */}
                  <g
                    className="mm-card-glyph"
                    style={{
                      color: isActive ? '#ffffff' : '#1f1d18',
                    }}
                  >
                    <use
                      href={`#${loc.iconId}`}
                      x="-11"
                      y="-12"
                      width="22"
                      height="22"
                    />
                  </g>
                  {/* tiny role tag inside the card top-right */}
                  <circle
                    cx="20"
                    cy="-16"
                    r="3"
                    fill={
                      loc.kind === 'donor'
                        ? '#22c55e'
                        : '#3b82f6'
                    }
                    stroke={isActive ? '#ffffff' : 'rgba(20,20,18,0.85)'}
                    strokeWidth="1"
                  />
                </g>
                {/* name label */}
                <text
                  x="0"
                  y="35"
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={isActive ? '#1f1d18' : 'rgba(31,29,24,0.72)'}
                  fontWeight={isActive ? 700 : 600}
                >
                  {loc.name}
                </text>
              </g>
            </g>
          )
        })}

        {/* Floating "in transit" chip above active-from card */}
        <g
          transform={`translate(${activeFrom.x} ${activeFrom.y - 38})`}
          style={{ pointerEvents: 'none' }}
        >
          <g className="mm-chip" style={{ opacity: 0, transformOrigin: '0 0' }}>
            <rect
              x="-38"
              y="-12"
              width="76"
              height="22"
              rx="11"
              fill="#1f1d18"
            />
            <circle cx="-28" cy="-1" r="2.4" fill="var(--color-accent, #d97706)" />
            <text
              x="-21"
              y="3"
              fontSize="9.5"
              fill="#ffffff"
              fontWeight="600"
            >
              In transit · 28 portions
            </text>
          </g>
        </g>

        {/* Map title chip top-left */}
        <g transform="translate(14 14)" style={{ pointerEvents: 'none' }}>
          <rect
            x="0"
            y="0"
            width="138"
            height="24"
            rx="12"
            fill="#ffffff"
            stroke="rgba(20,20,18,0.18)"
          />
          <circle
            className="mm-live-dot"
            cx="12"
            cy="12"
            r="3.2"
            fill="#22c55e"
            style={{ transformOrigin: '12px 12px' }}
          />
          <text
            x="22"
            y="15.5"
            fontSize="10"
            fill="#1f1d18"
            fontWeight="700"
          >
            FoodSetu Live Network
          </text>
        </g>

        {/* Compass top-right */}
        <g transform={`translate(${VBW - 28} 30)`} style={{ pointerEvents: 'none' }}>
          <circle
            cx="0"
            cy="0"
            r="14"
            fill="#ffffff"
            stroke="rgba(20,20,18,0.2)"
          />
          <g className="mm-compass-needle" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <path d="M 0 -10 L 3 0 L 0 2 L -3 0 Z" fill="var(--color-accent, #d97706)" />
            <path d="M 0 10 L 3 0 L 0 -2 L -3 0 Z" fill="rgba(31,29,24,0.55)" />
          </g>
          <text
            x="0"
            y="-16"
            textAnchor="middle"
            fontSize="7.5"
            fill="#1f1d18"
            fontWeight="800"
          >
            N
          </text>
        </g>

        {/* Scale bar bottom-left */}
        <g transform={`translate(14 ${VBH - 24})`} style={{ pointerEvents: 'none' }}>
          <line x1="0" y1="0" x2="64" y2="0" stroke="#1f1d18" strokeWidth="2" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#1f1d18" strokeWidth="1.5" />
          <line x1="32" y1="-3" x2="32" y2="3" stroke="#1f1d18" strokeWidth="1.5" />
          <line x1="64" y1="-3" x2="64" y2="3" stroke="#1f1d18" strokeWidth="1.5" />
          <text x="0" y="14" fontSize="8" fill="rgba(31,29,24,0.7)" fontWeight="600">
            0
          </text>
          <text x="32" y="14" textAnchor="middle" fontSize="8" fill="rgba(31,29,24,0.7)" fontWeight="600">
            5km
          </text>
          <text x="64" y="14" textAnchor="middle" fontSize="8" fill="rgba(31,29,24,0.7)" fontWeight="600">
            10km
          </text>
        </g>

        {/* Legend chip bottom-right */}
        <g transform={`translate(${VBW - 130} ${VBH - 32})`} style={{ pointerEvents: 'none' }}>
          <rect x="0" y="0" width="116" height="22" rx="11" fill="#ffffff" stroke="rgba(20,20,18,0.18)" />
          <circle cx="11" cy="11" r="3" fill="#22c55e" />
          <text x="18" y="14" fontSize="9" fill="#1f1d18" fontWeight="600">Donors</text>
          <circle cx="62" cy="11" r="3" fill="#3b82f6" />
          <text x="69" y="14" fontSize="9" fill="#1f1d18" fontWeight="600">Rescues</text>
        </g>
      </svg>
    </div>
  )
}

function HeroPanel() {
  return (
    <div className="relative">
      <div className="aspect-[5/6] w-full">
        <HeroNetwork />
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
