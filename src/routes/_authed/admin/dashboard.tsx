import { createFileRoute, redirect } from '@tanstack/react-router'
import {
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
import { Alert } from '../../../components/ui/Alert'
import { DashboardStatsCard } from '../../../components/ui/DashboardStatsCard'
import { PageHeader } from '../../../components/ui/PageHeader'
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
      <PageHeader
        title="Admin dashboard"
        description="Overview of the FoodSetu platform"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardStatsCard
          label="Total users"
          value={stats.totalUsers}
          icon={Users}
          to="/admin/users"
          tone="default"
        />
        <DashboardStatsCard
          label="Restaurants"
          value={stats.totalRestaurants}
          icon={Building2}
          to="/admin/organizations"
          tone="orange"
          hint="Verified + pending"
        />
        <DashboardStatsCard
          label="NGOs"
          value={stats.totalNgos}
          icon={Building2}
          to="/admin/organizations"
          tone="blue"
        />
        <DashboardStatsCard
          label="Animal rescue groups"
          value={stats.totalAnimalRescues}
          icon={Building2}
          to="/admin/organizations"
          tone="green"
        />
        <DashboardStatsCard
          label="Active food listings"
          value={stats.activeListings}
          icon={ShoppingBag}
          to="/admin/listings"
          tone="green"
          hint="Available, requested, or claimed"
        />
        <DashboardStatsCard
          label="Completed pickups"
          value={stats.completedPickups}
          icon={PackageCheck}
          to="/admin/listings"
          tone="purple"
        />
        <DashboardStatsCard
          label="Expired listings"
          value={stats.expiredListings}
          icon={XCircle}
          to="/admin/listings"
          tone="amber"
        />
        <DashboardStatsCard
          label="Pending verifications"
          value={stats.pendingVerificationRequests}
          icon={Clock}
          to="/admin/organizations"
          tone={
            stats.pendingVerificationRequests > 0 ? 'amber' : 'default'
          }
          hint="Organizations awaiting review"
        />
        <DashboardStatsCard
          label="Estimated rescued food"
          value={rescuedSummary}
          icon={Leaf}
          to="/admin/listings"
          tone="green"
          hint="Sum across completed pickups"
        />
      </div>

      <div className="mt-5">
        {stats.pendingVerificationRequests > 0 ? (
          <Alert
            tone="warning"
            title={`${stats.pendingVerificationRequests} organization${
              stats.pendingVerificationRequests === 1 ? '' : 's'
            } waiting for review`}
          >
            Head to{' '}
            <a
              href="/admin/organizations"
              className="font-medium underline"
            >
              Organizations
            </a>{' '}
            to verify, reject, or suspend them.
          </Alert>
        ) : (
          <Alert tone="success" title="All caught up">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              No organizations are awaiting verification.
            </span>
          </Alert>
        )}
      </div>
    </AdminShell>
  )
}
