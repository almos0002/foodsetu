import { Link, useLocation, useRouter } from '@tanstack/react-router'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Flag,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PawPrint,
  ShoppingBag,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { signOut } from '../lib/auth-client'
import { ROLE_LABELS, VERIFICATION_LABELS } from '../lib/permissions'
import type { Role, VerificationStatus } from '../lib/permissions'
import { Alert } from './ui/Alert'
import { cn } from './ui/cn'

type Org = {
  name?: string | null
  verificationStatus?: string | null
} | null

type Props = {
  title: string
  roleLabel: string
  user: {
    name?: string | null
    email?: string | null
    role?: string | null
  }
  organization?: Org | undefined
  children: ReactNode
}

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

type NavSection = {
  label: string
  items: NavItem[]
}

const RESTAURANT_NAV: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/restaurant/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/restaurant/listings', label: 'Listings', icon: ShoppingBag },
      {
        to: '/restaurant/claims',
        label: 'Claim requests',
        icon: ClipboardList,
      },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/reports', label: 'Reports', icon: Flag }],
  },
]

const NGO_NAV: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/ngo/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/ngo/nearby-food', label: 'Nearby food', icon: MapPin },
      { to: '/ngo/my-claims', label: 'My claims', icon: ShoppingBag },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/reports', label: 'Reports', icon: Flag }],
  },
]

const ANIMAL_NAV: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/animal/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/animal/nearby-food', label: 'Nearby food', icon: MapPin },
      { to: '/animal/my-claims', label: 'My claims', icon: PawPrint },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/reports', label: 'Reports', icon: Flag }],
  },
]

const ADMIN_NAV: NavSection[] = [
  {
    label: 'Platform',
    items: [
      { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/listings', label: 'Listings', icon: ShoppingBag },
      { to: '/admin/claims', label: 'Claims', icon: ClipboardList },
      { to: '/admin/reports', label: 'Reports', icon: Flag },
      { to: '/admin/cities', label: 'Cities', icon: MapPin },
    ],
  },
]

function navForRole(role: string | null | undefined): NavSection[] {
  switch (role) {
    case 'RESTAURANT':
      return RESTAURANT_NAV
    case 'NGO':
      return NGO_NAV
    case 'ANIMAL_RESCUE':
      return ANIMAL_NAV
    case 'ADMIN':
      return ADMIN_NAV
    default:
      return []
  }
}

function isActive(path: string, to: string, isOverview: boolean): boolean {
  if (path === to) return true
  if (isOverview) return false
  return path.startsWith(to)
}

function initials(name?: string | null, email?: string | null): string {
  const source = (name || email || 'U').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function DashboardShell({
  title: _title,
  roleLabel,
  user,
  organization,
  children,
}: Props) {
  const router = useRouter()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const sections = navForRole(user.role)
  const status = (organization?.verificationStatus ??
    null) as VerificationStatus | null

  // Close drawer + menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Lock body scroll + handle Escape while mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  // Close user menu on outside click + Escape
  useEffect(() => {
    if (!userMenuOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (target && !target.closest('[data-user-menu]')) {
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [userMenuOpen])

  async function handleSignOut() {
    await signOut()
    router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b-[1.5px] border-[var(--color-line)] bg-white px-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-display text-lg font-bold tracking-tight">
            FoodSetu
          </span>
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-[var(--color-line-strong)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-cream)]"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[var(--color-ink)]/55"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r-[1.5px] border-[var(--color-line)] bg-white">
            <div className="flex h-16 items-center justify-between border-b-[1.5px] border-[var(--color-line)] px-4">
              <Link to="/" className="flex items-center gap-2.5">
                <BrandMark />
                <span className="font-display text-lg font-bold tracking-tight">
                  FoodSetu
                </span>
              </Link>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[var(--color-line)] text-[var(--color-ink-2)] hover:bg-[var(--color-cream)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarBody
              sections={sections}
              path={location.pathname}
              user={user}
              roleLabel={roleLabel}
              organization={organization}
              status={status}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[272px] flex-col border-r-[1.5px] border-[var(--color-line)] bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b-[1.5px] border-[var(--color-line)] px-6">
          <BrandMark />
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-tight text-[var(--color-ink)]">
              FoodSetu
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-coral)]">
              Surplus, picked up fast
            </div>
          </div>
        </div>
        <SidebarBody
          sections={sections}
          path={location.pathname}
          user={user}
          roleLabel={roleLabel}
          organization={organization}
          status={status}
          onSignOut={handleSignOut}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
        />
      </aside>

      {/* Main */}
      <div className="lg:pl-[272px]">
        <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {status && status !== 'VERIFIED' ? (
            <VerificationBanner status={status} />
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarBody({
  sections,
  path,
  user,
  roleLabel,
  organization,
  status,
  onSignOut,
  userMenuOpen,
  setUserMenuOpen,
}: {
  sections: NavSection[]
  path: string
  user: Props['user']
  roleLabel: string
  organization?: Org | undefined
  status: VerificationStatus | null
  onSignOut: () => void
  userMenuOpen?: boolean
  setUserMenuOpen?: (v: boolean | ((prev: boolean) => boolean)) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {organization?.name ? (
        <div className="border-b-[1.5px] border-dashed border-[var(--color-line)] px-5 py-4">
          <div className="tiny-cap text-[var(--color-ink-3)]">Organization</div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-[var(--color-ink)]">
                {organization.name}
              </div>
              <div className="text-xs text-[var(--color-ink-2)]">
                {ROLE_LABELS[(user.role as Role) ?? 'RESTAURANT'] ?? roleLabel}
              </div>
            </div>
            {status ? <VerificationDot status={status} /> : null}
          </div>
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="px-3 tiny-cap text-[var(--color-ink-3)]">
                {section.label}
              </div>
              <ul className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const isOverview = item.label === 'Overview'
                  const active = isActive(path, item.to, isOverview)
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={cn(
                          'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors',
                          active
                            ? 'bg-[var(--color-coral)] text-white'
                            : 'text-[var(--color-ink-2)] hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)]',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            active
                              ? 'text-white'
                              : 'text-[var(--color-ink-3)] group-hover:text-[var(--color-coral)]',
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t-[1.5px] border-[var(--color-line)] p-3">
        <div className="relative" data-user-menu>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen ?? false}
            onClick={() => setUserMenuOpen?.((v) => !v)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors',
              userMenuOpen
                ? 'bg-[var(--color-cream)]'
                : 'hover:bg-[var(--color-cream)]',
            )}
          >
            <div className="flex h-9 w-9 -rotate-3 flex-shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-[var(--color-mint)] text-xs font-bold text-white">
              {initials(user.name, user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-[var(--color-ink)]">
                {user.name ?? user.email}
              </div>
              <div className="truncate text-xs text-[var(--color-ink-2)]">
                {roleLabel}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 flex-shrink-0 text-[var(--color-ink-3)] transition-transform',
                userMenuOpen && 'rotate-180',
              )}
            />
          </button>
          {userMenuOpen ? (
            <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-white">
              <button
                type="button"
                onClick={onSignOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-cream)]"
              >
                <LogOut className="h-4 w-4 text-[var(--color-coral)]" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignOut}
              className="mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-2)] hover:bg-[var(--color-cream)] hover:text-[var(--color-ink)] lg:hidden"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BrandMark() {
  // Tiny bowl mascot — friendly, rotated for personality.
  return (
    <div className="relative flex h-10 w-10 -rotate-6 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-[var(--color-coral)]">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
        <path
          d="M5 16 Q 5 24 16 25 Q 27 24 27 16 Z"
          fill="white"
          stroke="#1a1f2e"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="13" cy="19" r="1.4" fill="#1a1f2e" />
        <circle cx="19" cy="19" r="1.4" fill="#1a1f2e" />
        <path
          d="M14 22 Q 16 23.5 18 22"
          fill="none"
          stroke="#1a1f2e"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M11 12 Q 12 9 11 7"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 11 Q 17 8 16 6"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M21 12 Q 22 9 21 7"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function VerificationDot({ status }: { status: VerificationStatus }) {
  const config: Record<
    VerificationStatus,
    { color: string; label: string; icon: typeof CheckCircle2 }
  > = {
    VERIFIED: {
      color: 'bg-[var(--color-mint)]',
      label: VERIFICATION_LABELS.VERIFIED,
      icon: CheckCircle2,
    },
    PENDING: {
      color: 'bg-[var(--color-sun)]',
      label: VERIFICATION_LABELS.PENDING,
      icon: Clock,
    },
    REJECTED: {
      color: 'bg-[var(--color-coral)]',
      label: VERIFICATION_LABELS.REJECTED,
      icon: XCircle,
    },
    SUSPENDED: {
      color: 'bg-[var(--color-ink-3)]',
      label: VERIFICATION_LABELS.SUSPENDED,
      icon: AlertTriangle,
    },
  }
  const c = config[status]
  return (
    <span
      title={c.label}
      className="inline-flex h-2.5 w-2.5 flex-shrink-0 items-center justify-center"
    >
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-full ring-2 ring-white',
          c.color,
        )}
      />
    </span>
  )
}

function VerificationBanner({ status }: { status: VerificationStatus }) {
  const config: Record<
    VerificationStatus,
    { tone: 'warning' | 'error' | 'info'; title: string; body: string }
  > = {
    PENDING: {
      tone: 'warning',
      title: 'Awaiting verification',
      body: "Your organization is waiting for an admin to review it. You can't post listings or claim food yet.",
    },
    REJECTED: {
      tone: 'error',
      title: 'Verification rejected',
      body: 'An admin rejected your organization profile. Please contact support to resolve the issue.',
    },
    SUSPENDED: {
      tone: 'warning',
      title: 'Account suspended',
      body: 'Your organization has been suspended. Contact support if you believe this is in error.',
    },
    VERIFIED: { tone: 'info', title: '', body: '' },
  }
  const c = config[status]
  return (
    <Alert tone={c.tone} title={c.title} className="mb-6">
      {c.body}
    </Alert>
  )
}
