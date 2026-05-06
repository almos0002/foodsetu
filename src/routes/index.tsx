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

type HeroNetworkNode = {
  id: string
  x: number
  y: number
  iconId: string
  name: string
  kind: 'donor' | 'claim'
}

// Mixed donor/claimant placement so the network reads as an organic
// constellation, not two strict rows.
const NETWORK_NODES: HeroNetworkNode[] = [
  { id: 'd0', x: 70, y: 80, iconId: 'i-bakery', name: 'Bhojan Griha', kind: 'donor' },
  { id: 'd1', x: 220, y: 50, iconId: 'i-hotel', name: 'Hotel Annapurna', kind: 'donor' },
  { id: 'd2', x: 340, y: 130, iconId: 'i-restaurant', name: 'Thakali Kitchen', kind: 'donor' },
  { id: 'd3', x: 175, y: 220, iconId: 'i-cafe', name: 'Himalayan Java', kind: 'donor' },
  { id: 'c0', x: 60, y: 290, iconId: 'i-ngo', name: 'Karuna Nepal', kind: 'claim' },
  { id: 'c1', x: 320, y: 270, iconId: 'i-shelter', name: 'Sarvanam Trust', kind: 'claim' },
  { id: 'c2', x: 130, y: 415, iconId: 'i-bowl', name: 'CARE Nepal', kind: 'claim' },
  { id: 'c3', x: 320, y: 425, iconId: 'i-paw', name: 'KAT Centre', kind: 'claim' },
]

// Each route picks two NETWORK_NODES indices (donor → claimant).
const NETWORK_ROUTES = [
  { from: 0, to: 4, bow: -28 },
  { from: 1, to: 5, bow: 26 },
  { from: 2, to: 5, bow: -22 },
  { from: 3, to: 6, bow: -22 },
  { from: 0, to: 6, bow: 30 },
  { from: 1, to: 7, bow: -34 },
  { from: 2, to: 7, bow: -22 },
  { from: 3, to: 4, bow: 24 },
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
  const donors = NETWORK_NODES.filter((n) => n.kind === 'donor')
  const claimants = NETWORK_NODES.filter((n) => n.kind === 'claim')
  void donors
  void claimants

  const [active, setActive] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)

  // Build the curved path string for a route.
  const curve = (a: HeroNetworkNode, b: HeroNetworkNode, bow: number) => {
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const px = -dy / len
    const py = dx / len
    return `M ${a.x} ${a.y} Q ${mx + px * bow} ${my + py * bow} ${b.x} ${b.y}`
  }

  const activeRoute = NETWORK_ROUTES[active]
  const activeFromNode = NETWORK_NODES[activeRoute.from]
  const activeToNode = NETWORK_NODES[activeRoute.to]
  const activeD = curve(activeFromNode, activeToNode, activeRoute.bow)

  // Cycle the active route.
  useEffect(() => {
    const id = setInterval(
      () => setActive((i) => (i + 1) % NETWORK_ROUTES.length),
      2400,
    )
    return () => clearInterval(id)
  }, [])

  // Mount: stagger-in nodes, gentle perpetual breathing on each.
  useEffect(() => {
    if (!svgRef.current) return
    let cancelled = false
    let cleanups: Array<() => void> = []
    ;(async () => {
      const anime = await import('animejs')
      if (cancelled || !svgRef.current) return
      const root = svgRef.current

      // Entrance: scale-in nodes with overshoot
      anime.animate(root.querySelectorAll('.hn-node-inner'), {
        scale: [{ from: 0, to: 1 }],
        opacity: [{ from: 0, to: 1 }],
        rotate: [{ from: -90, to: 0 }],
        duration: 750,
        delay: anime.stagger(70),
        ease: 'outBack(1.6)',
      })

      // Continuous breathing — different phase per node so they don't sync
      const inners = root.querySelectorAll<SVGGElement>('.hn-node-inner')
      inners.forEach((el, i) => {
        const a = anime.animate(el, {
          translateY: [
            { to: -3, duration: 2200 + i * 180, ease: 'inOutSine' },
            { to: 3, duration: 2200 + i * 180, ease: 'inOutSine' },
            { to: 0, duration: 2200 + i * 180, ease: 'inOutSine' },
          ],
          loop: true,
          delay: i * 180,
        })
        cleanups.push(() => a.pause())
      })
    })()
    return () => {
      cancelled = true
      cleanups.forEach((c) => c())
    }
  }, [])

  // Per-cycle: draw active path, fly parcel, ping rings, spin active icons.
  useEffect(() => {
    if (!svgRef.current) return
    let cancelled = false
    const anims: Array<{ pause: () => void }> = []
    ;(async () => {
      const anime = await import('animejs')
      if (cancelled || !svgRef.current) return
      const root = svgRef.current
      const path = root.querySelector<SVGPathElement>('.hn-active-path')
      const glow = root.querySelector<SVGPathElement>('.hn-active-glow')
      const parcel = root.querySelector<SVGGElement>('.hn-parcel')
      const tail1 = root.querySelector<SVGGElement>('.hn-tail-1')
      const tail2 = root.querySelector<SVGGElement>('.hn-tail-2')
      if (!path || !parcel || !tail1 || !tail2 || !glow) return

      const len = path.getTotalLength()
      path.style.strokeDasharray = String(len)
      path.style.strokeDashoffset = String(len)
      glow.style.strokeDasharray = String(len)
      glow.style.strokeDashoffset = String(len)

      // Reset parcel + tail to start
      parcel.style.opacity = '0'
      tail1.style.opacity = '0'
      tail2.style.opacity = '0'

      // 1. Draw the line
      const drawA = anime.animate(path, {
        strokeDashoffset: [len, 0],
        duration: 900,
        ease: 'outQuad',
      })
      const drawB = anime.animate(glow, {
        strokeDashoffset: [len, 0],
        duration: 900,
        ease: 'outQuad',
      })
      anims.push(drawA, drawB)

      // 2. Fly parcel along the path
      const motion = anime.svg.createMotionPath(path)
      const parcelAnim = anime.animate(parcel, {
        ...motion,
        opacity: [{ to: 1, duration: 100 }],
        duration: 1400,
        delay: 250,
        ease: 'inOutSine',
      })
      const tail1Anim = anime.animate(tail1, {
        ...motion,
        opacity: [{ to: 0.55, duration: 100 }],
        duration: 1400,
        delay: 380,
        ease: 'inOutSine',
      })
      const tail2Anim = anime.animate(tail2, {
        ...motion,
        opacity: [{ to: 0.3, duration: 100 }],
        duration: 1400,
        delay: 480,
        ease: 'inOutSine',
      })
      anims.push(parcelAnim, tail1Anim, tail2Anim)

      // 3. Ping rings on active endpoints (radar pulses)
      const rings = root.querySelectorAll<SVGCircleElement>('.hn-ping circle')
      rings.forEach((c, i) => {
        c.setAttribute('r', '12')
        c.setAttribute('opacity', '0')
        const a = anime.animate(c, {
          r: [12, 38],
          opacity: [{ to: 0.7, duration: 80 }, { to: 0, duration: 1100 }],
          strokeWidth: [2, 0.4],
          duration: 1200,
          delay: 100 + (i % 3) * 180 + Math.floor(i / 3) * 0,
          loop: 2,
          ease: 'outQuad',
        })
        anims.push(a)
      })

      // 4. Spin + pop the two active icon glyphs
      const activeGlyphs = root.querySelectorAll<SVGGElement>('.hn-glyph-active')
      activeGlyphs.forEach((g) => {
        const a = anime.animate(g, {
          rotate: [{ from: 0, to: 360 }],
          scale: [
            { from: 1, to: 1.25, duration: 220 },
            { to: 1, duration: 280 },
          ],
          duration: 700,
          ease: 'outBack(2)',
        })
        anims.push(a)
      })
    })()
    return () => {
      cancelled = true
      anims.forEach((a) => a.pause())
    }
  }, [active])

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} ${VBH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="hn-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {Object.entries(ICON_PATHS).map(([id, body]) => (
            <symbol
              key={id}
              id={id}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {body}
            </symbol>
          ))}
        </defs>

        {/* Background routes — every connection visible at all times */}
        {NETWORK_ROUTES.map((r, i) => {
          const a = NETWORK_NODES[r.from]
          const b = NETWORK_NODES[r.to]
          const d = curve(a, b, r.bow)
          const isActive = i === active
          return (
            <path
              key={`bg-${i}`}
              d={d}
              fill="none"
              stroke="var(--color-line-strong)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="3 5"
              opacity={isActive ? 0 : 0.55}
            />
          )
        })}

        {/* Active route — soft glow underlay + crisp accent line */}
        <path
          className="hn-active-glow"
          d={activeD}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.3"
          filter="url(#hn-glow)"
        />
        <path
          className="hn-active-path"
          d={activeD}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Radar pulse rings on the two active endpoints */}
        <g className="hn-ping">
          {[0, 1, 2].map((i) => (
            <circle
              key={`pf-${i}`}
              cx={activeFromNode.x}
              cy={activeFromNode.y}
              r="12"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              opacity="0"
            />
          ))}
          {[0, 1, 2].map((i) => (
            <circle
              key={`pt-${i}`}
              cx={activeToNode.x}
              cy={activeToNode.y}
              r="12"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              opacity="0"
            />
          ))}
        </g>

        {/* Parcel + comet tail — anime.js drives translateX/Y along the path */}
        <g className="hn-parcel" style={{ opacity: 0 }}>
          <circle r="6" fill="var(--color-accent)" filter="url(#hn-glow)" />
        </g>
        <g className="hn-tail-1" style={{ opacity: 0 }}>
          <circle r="3.5" fill="var(--color-accent)" opacity="0.6" />
        </g>
        <g className="hn-tail-2" style={{ opacity: 0 }}>
          <circle r="2.2" fill="var(--color-accent)" opacity="0.4" />
        </g>

        {/* Nodes */}
        {NETWORK_NODES.map((n) => {
          const isActive =
            n.id === activeFromNode.id || n.id === activeToNode.id
          return (
            <g key={n.id} transform={`translate(${n.x} ${n.y})`}>
              <g className="hn-node-inner" style={{ transformOrigin: '0 0' }}>
                {/* Outer ring chip */}
                <circle
                  r="20"
                  fill={isActive ? 'var(--color-accent)' : 'var(--color-paper)'}
                  stroke={
                    isActive
                      ? 'var(--color-accent)'
                      : 'var(--color-line-strong)'
                  }
                  strokeWidth={isActive ? 2 : 1}
                  style={{
                    filter: isActive
                      ? 'drop-shadow(0 6px 14px rgba(220,90,40,0.35))'
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))',
                    transition: 'all 400ms ease',
                  }}
                />
                <g
                  className={isActive ? 'hn-glyph-active' : 'hn-glyph'}
                  style={{
                    color: isActive
                      ? 'var(--color-paper)'
                      : 'var(--color-ink-2)',
                    transformOrigin: '0 0',
                  }}
                >
                  <use href={`#${n.iconId}`} x={-11} y={-11} width={22} height={22} />
                </g>
              </g>
            </g>
          )
        })}
      </svg>

      {/* HTML popover labels — always visible, active one highlighted */}
      <div className="pointer-events-none absolute inset-0">
        {NETWORK_NODES.map((n) => {
          const isActive =
            n.id === activeFromNode.id || n.id === activeToNode.id
          // place label above for nodes in lower half, below for upper half
          const above = n.y > VBH * 0.55
          return (
            <div
              key={n.id}
              className="absolute -translate-x-1/2 transition-all duration-300"
              style={{
                left: `${(n.x / VBW) * 100}%`,
                top: `calc(${(n.y / VBH) * 100}% + ${above ? '-44px' : '28px'})`,
              }}
            >
              <span
                className="inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-medium shadow-sm"
                style={{
                  background: isActive
                    ? 'var(--color-ink)'
                    : 'var(--color-paper)',
                  color: isActive
                    ? 'var(--color-paper)'
                    : 'var(--color-ink-2)',
                  border: `1px solid ${isActive ? 'var(--color-ink)' : 'var(--color-line)'}`,
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
                  opacity: isActive ? 1 : 0.78,
                }}
              >
                {n.name}
              </span>
            </div>
          )
        })}
      </div>
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
