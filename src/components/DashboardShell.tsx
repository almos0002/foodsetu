import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Flag,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Settings as SettingsIcon,
  ShoppingBag,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { signOut } from '../lib/auth-client'
import { BowlMascot } from '../routes/index'
import {
  VERIFICATION_BADGE_CLASSES,
  VERIFICATION_LABELS,
} from '../lib/permissions'
import type { VerificationStatus } from '../lib/permissions'

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
  organization?: Org
  children: ReactNode
}

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  exact?: boolean
  indent?: boolean
}

const RESTAURANT_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/restaurant/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Listings', to: '/restaurant/listings', icon: ShoppingBag },
  { label: 'New listing', to: '/restaurant/listings/new', icon: Plus, exact: true, indent: true },
  { label: 'Claims', to: '/restaurant/claims', icon: Inbox },
  { label: 'Reports', to: '/reports', icon: Flag },
  { label: 'Settings', to: '/settings/organization', icon: SettingsIcon },
]

const NGO_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/ngo/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Browse food', to: '/ngo/nearby-food', icon: MapPin },
  { label: 'My claims', to: '/ngo/my-claims', icon: ShoppingBag },
  { label: 'Reports', to: '/reports', icon: Flag },
  { label: 'Settings', to: '/settings/organization', icon: SettingsIcon },
]

const ANIMAL_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/animal/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Browse food', to: '/animal/nearby-food', icon: MapPin },
  { label: 'My claims', to: '/animal/my-claims', icon: ShoppingBag },
  { label: 'Reports', to: '/reports', icon: Flag },
  { label: 'Settings', to: '/settings/organization', icon: SettingsIcon },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Organizations', to: '/admin/organizations', icon: Building2 },
  { label: 'Listings', to: '/admin/listings', icon: ShoppingBag },
  { label: 'Claims', to: '/admin/claims', icon: ClipboardList },
  { label: 'Reports', to: '/admin/reports', icon: Flag },
  { label: 'Cities', to: '/admin/cities', icon: BookOpen },
]

function navForRole(role: string | null | undefined): NavItem[] {
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

const COLLAPSE_KEY = 'foodsetu:sidebar-collapsed'

export function DashboardShell({
  title,
  roleLabel,
  user,
  organization,
  children,
}: Props) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Hydrate collapsed state from localStorage (client-only).
  useEffect(() => {
    if (typeof window === 'undefined') return
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1')
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      }
      return next
    })
  }

  // Auto-close mobile drawer when route changes.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  async function handleSignOut() {
    await signOut()
    router.invalidate()
    await router.navigate({ to: '/login' })
  }

  const status = (organization?.verificationStatus ?? null) as VerificationStatus | null
  const navItems = navForRole(user.role)
  const sidebarWidth = collapsed ? 'w-16' : 'w-64'

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar — full height, flush with the navbar (no gap) */}
      <aside
        className={`sticky top-0 hidden h-screen ${sidebarWidth} shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 md:flex`}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-gray-200 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <BowlMascot className="h-7 w-7 shrink-0" />
            {collapsed ? null : (
              <span className="truncate text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
                FoodSetu
              </span>
            )}
          </Link>
        </div>
        <SidebarNav items={navItems} pathname={pathname} collapsed={collapsed} />
        <SidebarFooter
          user={user}
          roleLabel={roleLabel}
          onSignOut={handleSignOut}
          collapsed={collapsed}
        />
      </aside>

      {/* Right column: navbar + main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 md:px-6">
          {/* Mobile menu */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center squircle text-gray-700 hover:bg-gray-100 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden h-9 w-9 items-center justify-center squircle text-gray-700 hover:bg-gray-100 md:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          {/* Mobile-only logo */}
          <Link to="/" className="flex items-center gap-2.5 md:hidden">
            <BowlMascot className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
              FoodSetu
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block md:hidden">
              <div className="text-sm font-medium text-gray-900">
                {user.name ?? user.email}
              </div>
              <div className="text-xs text-gray-500">{roleLabel}</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 squircle border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 md:hidden"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-6xl">
            {status && status !== 'VERIFIED' ? (
              <VerificationBanner status={status} />
            ) : null}

            {children}
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2.5"
              >
                <BowlMascot className="h-7 w-7" />
                <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
                  FoodSetu
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center squircle text-gray-700 hover:bg-gray-100"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav
              items={navItems}
              pathname={pathname}
              onNavigate={() => setDrawerOpen(false)}
            />
            <SidebarFooter
              user={user}
              roleLabel={roleLabel}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

function SidebarNav({
  items,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
  collapsed?: boolean
}) {
  if (items.length === 0) return <div className="flex-1" />
  return (
    <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item)
          const Icon = item.icon
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-2.5 squircle text-sm font-medium transition-colors ${
                  collapsed
                    ? 'justify-center px-0 py-2'
                    : `px-3 py-2 ${item.indent ? 'ml-5' : ''}`
                } ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${
                    active ? 'text-white' : 'text-gray-500 group-hover:text-gray-900'
                  }`}
                />
                {collapsed ? null : <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function SidebarFooter({
  user,
  roleLabel,
  onSignOut,
  collapsed = false,
}: {
  user: Props['user']
  roleLabel: string
  onSignOut: () => void
  collapsed?: boolean
}) {
  if (collapsed) {
    return (
      <div className="border-t border-gray-200 p-2">
        <button
          type="button"
          onClick={onSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="flex w-full items-center justify-center squircle px-0 py-2 text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }
  return (
    <div className="border-t border-gray-200 p-4">
      <div className="mb-3 min-w-0">
        <div className="truncate text-sm font-medium text-gray-900">
          {user.name ?? user.email ?? 'Account'}
        </div>
        {user.name && user.email ? (
          <div className="truncate text-xs text-gray-500">{user.email}</div>
        ) : null}
        <div className="mt-0.5 text-xs text-gray-500">{roleLabel}</div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="flex w-full items-center justify-center gap-1.5 squircle border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )
}

function StatusIcon({ status }: { status: VerificationStatus }) {
  switch (status) {
    case 'VERIFIED':
      return <CheckCircle2 className="h-3.5 w-3.5" />
    case 'REJECTED':
      return <XCircle className="h-3.5 w-3.5" />
    case 'SUSPENDED':
      return <AlertTriangle className="h-3.5 w-3.5" />
    case 'PENDING':
    default:
      return <Clock className="h-3.5 w-3.5" />
  }
}

function VerificationBanner({ status }: { status: VerificationStatus }) {
  const config: Record<
    VerificationStatus,
    { wrapper: string; title: string; body: string }
  > = {
    PENDING: {
      wrapper: 'bg-amber-50 ring-amber-200 text-amber-900',
      title: 'Awaiting verification',
      body:
        "Your organization is waiting for an admin to review it. You can't post listings or claim food yet.",
    },
    REJECTED: {
      wrapper: 'bg-red-50 ring-red-200 text-red-900',
      title: 'Verification rejected',
      body:
        'An admin rejected your organization profile. Please contact support to resolve the issue.',
    },
    SUSPENDED: {
      wrapper: 'bg-gray-100 ring-gray-300 text-gray-800',
      title: 'Account suspended',
      body: 'Your organization has been suspended. Contact support if you believe this is in error.',
    },
    VERIFIED: { wrapper: '', title: '', body: '' },
  }
  const c = config[status]
  return (
    <div className={`mb-6 squircle px-4 py-3 text-sm ring-1 ${c.wrapper}`}>
      <div className="font-semibold">{c.title}</div>
      <div className="mt-0.5">{c.body}</div>
    </div>
  )
}

