import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Leaf,
  PackageCheck,
  ShoppingBag,
  Users,
  XCircle,
} from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { StatCard } from '../../../components/admin/StatCard'
import { getAdminStatsFn } from '../../../lib/admin-server'
import { canAccessAdmin, roleToDashboard } from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => ({ stats: await getAdminStatsFn() }),
  component: AdminDashboard,
})

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function AdminDashboard() {
  const { stats } = Route.useLoaderData()
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }

  const rescuedSummary =
    stats.rescuedFoodByUnit.length === 0
      ? '—'
      : stats.rescuedFoodByUnit
          .slice(0, 3)
          .map((r) => `${formatCompact(r.total)} ${r.unit}`)
          .join(' · ')

  return (
    <AdminShell title="Admin dashboard" user={user}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          icon={Users}
          to="/admin/users"
        />
        <StatCard
          label="Restaurants"
          value={stats.totalRestaurants}
          icon={Building2}
          to="/admin/organizations"
          hint="Verified + pending"
        />
        <StatCard
          label="NGOs"
          value={stats.totalNgos}
          icon={Building2}
          to="/admin/organizations"
        />
        <StatCard
          label="Animal rescue groups"
          value={stats.totalAnimalRescues}
          icon={Building2}
          to="/admin/organizations"
        />
        <StatCard
          label="Active food listings"
          value={stats.activeListings}
          icon={ShoppingBag}
          to="/admin/listings"
          tone="success"
          hint="Available, claim-requested, or claimed"
        />
        <StatCard
          label="Completed pickups"
          value={stats.completedPickups}
          icon={PackageCheck}
          to="/admin/listings"
          tone="success"
        />
        <StatCard
          label="Expired listings"
          value={stats.expiredListings}
          icon={XCircle}
          to="/admin/listings"
          tone="warning"
        />
        <StatCard
          label="Pending verifications"
          value={stats.pendingVerificationRequests}
          icon={Clock}
          to="/admin/organizations"
          tone={
            stats.pendingVerificationRequests > 0 ? 'warning' : 'default'
          }
          hint="Organizations awaiting review"
        />
        <StatCard
          label="Estimated rescued food"
          value={rescuedSummary}
          icon={Leaf}
          to="/admin/listings"
          tone="success"
          hint="Sum across completed pickups"
        />
      </div>

      {stats.pendingVerificationRequests > 0 ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <div className="font-semibold">
              {stats.pendingVerificationRequests} organization
              {stats.pendingVerificationRequests === 1 ? '' : 's'} waiting for
              review
            </div>
            <div className="mt-0.5">
              Head to{' '}
              <a
                href="/admin/organizations"
                className="font-medium text-amber-900 underline"
              >
                Organizations
              </a>{' '}
              to verify, reject, or suspend them.
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />
          <span>No organizations are awaiting verification.</span>
        </div>
      )}
    </AdminShell>
  )
}
