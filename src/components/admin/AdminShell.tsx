import { Link, useLocation } from '@tanstack/react-router'
import {
  Building2,
  ClipboardList,
  Flag,
  LayoutDashboard,
  MapPin,
  ShoppingBag,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { DashboardShell } from '../DashboardShell'
import { ROLE_LABELS } from '../../lib/permissions'
import { cn } from '../ui/cn'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

const NAV: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/listings', label: 'Listings', icon: ShoppingBag },
  { to: '/admin/claims', label: 'Claims', icon: ClipboardList },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/cities', label: 'Cities', icon: MapPin },
]

type Props = {
  title: string
  user: { name?: string | null; email?: string | null }
  children: ReactNode
}

export function AdminShell({ title, user, children }: Props) {
  const location = useLocation()
  const path = location.pathname

  return (
    <DashboardShell
      title={title}
      roleLabel={ROLE_LABELS.ADMIN}
      user={user}
      organization={null}
    >
      <div className="grid gap-5 md:grid-cols-[210px_minmax(0,1fr)]">
        <nav className="md:sticky md:top-20 md:self-start">
          <div className="rounded-lg border border-gray-200 bg-white p-1.5 md:p-2">
            <ul className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
              {NAV.map(({ to, label, icon: Icon }) => {
                const active =
                  path === to ||
                  (to !== '/admin/dashboard' && path.startsWith(to))
                return (
                  <li key={to} className="md:w-full">
                    <Link
                      to={to}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-orange-50 font-semibold text-orange-700'
                          : 'text-gray-700 hover:bg-gray-50',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </DashboardShell>
  )
}
