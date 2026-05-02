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
      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <nav className="md:sticky md:top-6 md:self-start">
          <ul className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active =
                path === to || (to !== '/admin/dashboard' && path.startsWith(to))
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? 'bg-orange-50 font-semibold text-orange-700 ring-1 ring-orange-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </DashboardShell>
  )
}
