import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flag,
  Leaf,
  PackageCheck,
  ShoppingBag,
  Users,
  XCircle,
} from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { Button } from '../../../components/ui/Button'
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
          .slice(0, 2)
          .map((r) => `${formatCompact(r.total)} ${r.unit}`)
          .join(' · ')

  const totalOrgs =
    stats.totalRestaurants + stats.totalNgos + stats.totalAnimalRescues

  return (
    <AdminShell title="Admin dashboard" user={user}>
      <PageHeader
        eyebrow="Platform"
        title="Overview"
        description="Health check of the FoodSetu network — orgs, listings, and pickups at a glance."
      />

      {/* Headline KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          label="Total users"
          value={stats.totalUsers}
          icon={Users}
          to="/admin/users"
          tone="default"
          hint="Across all roles"
        />
        <DashboardStatsCard
          label="Organizations"
          value={totalOrgs}
          icon={Building2}
          to="/admin/organizations"
          tone="blue"
          hint="Restaurants, NGOs, rescues"
        />
        <DashboardStatsCard
          label="Active listings"
          value={stats.activeListings}
          icon={ShoppingBag}
          to="/admin/listings"
          tone="orange"
          hint="Available, requested, claimed"
        />
        <DashboardStatsCard
          label="Completed pickups"
          value={stats.completedPickups}
          icon={PackageCheck}
          to="/admin/listings"
          tone="green"
          hint="Lifetime"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Org breakdown panel */}
        <div className="rounded-lg border border-gray-200 bg-white lg:col-span-2">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-900">
              Organization breakdown
            </h2>
            <p className="text-xs text-gray-500">
              Verified and pending across each role
            </p>
          </div>
          <div className="grid gap-px bg-gray-100 sm:grid-cols-3">
            <OrgStat
              label="Restaurants"
              value={stats.totalRestaurants}
              tone="text-orange-600"
            />
            <OrgStat
              label="NGOs"
              value={stats.totalNgos}
              tone="text-blue-600"
            />
            <OrgStat
              label="Animal rescues"
              value={stats.totalAnimalRescues}
              tone="text-emerald-600"
            />
          </div>
        </div>

        {/* Action queue */}
        <div className="space-y-3">
          {stats.pendingVerificationRequests > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-700" />
                <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700">
                  Action required
                </div>
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums text-amber-900">
                {stats.pendingVerificationRequests}
              </div>
              <p className="mt-1 text-sm text-amber-900">
                organization
                {stats.pendingVerificationRequests === 1 ? '' : 's'} awaiting
                verification
              </p>
              <Link to="/admin/organizations" className="mt-3 inline-block">
                <Button
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Review now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700">
                  All caught up
                </div>
              </div>
              <p className="mt-2 text-sm text-emerald-900">
                No organizations are awaiting verification.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Quick links
            </div>
            <div className="mt-3 space-y-2">
              <Link to="/admin/organizations" className="block">
                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={<Building2 className="h-4 w-4" />}
                >
                  Organizations
                </Button>
              </Link>
              <Link to="/admin/reports" className="block">
                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={<Flag className="h-4 w-4" />}
                >
                  Reports
                </Button>
              </Link>
              <Link to="/admin/claims" className="block">
                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={<ClipboardList className="h-4 w-4" />}
                >
                  Claims
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <DashboardStatsCard
          label="Expired listings"
          value={stats.expiredListings}
          icon={XCircle}
          to="/admin/listings"
          tone="amber"
          hint="Time-window passed"
        />
        <DashboardStatsCard
          label="Pending verifications"
          value={stats.pendingVerificationRequests}
          icon={Clock}
          to="/admin/organizations"
          tone={
            stats.pendingVerificationRequests > 0 ? 'amber' : 'default'
          }
          hint="Orgs awaiting review"
        />
        <DashboardStatsCard
          label="Rescued food"
          value={rescuedSummary}
          icon={Leaf}
          to="/admin/listings"
          tone="green"
          hint="Sum across pickups"
        />
      </div>
    </AdminShell>
  )
}

function OrgStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="bg-white px-5 py-5">
      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold tabular-nums ${tone}`}>
        {value}
      </div>
    </div>
  )
}
