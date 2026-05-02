import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  Calendar,
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
import { DashboardWelcomeBanner } from '../../../components/ui/DashboardWelcomeBanner'
import { getAdminStatsFn } from '../../../lib/admin-server'
import { canAccessAdmin, roleToDashboard } from '../../../lib/permissions'

const BANNER_IMG =
  'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=900&auto=format&fit=crop&q=80'

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

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
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
      <DashboardWelcomeBanner
        tone="gray"
        eyebrow="Platform overview"
        title="Network health at a glance"
        description="Organizations, listings, pickups and verifications across every city FoodSetu operates in."
        image={BANNER_IMG}
        chips={[
          { label: todayLabel(), icon: <Calendar className="h-3.5 w-3.5" /> },
          {
            label: `${totalOrgs} organizations`,
            icon: <Building2 className="h-3.5 w-3.5" />,
          },
        ]}
        actions={
          <>
            <Link to="/admin/organizations">
              <Button leftIcon={<Building2 className="h-4 w-4" />}>
                Review organizations
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                leftIcon={<Flag className="h-4 w-4" />}
              >
                Reports
              </Button>
            </Link>
          </>
        }
      />

      {/* Headline KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Org breakdown panel */}
        <div className="rounded-2xl border border-gray-200 bg-white lg:col-span-2">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Organization breakdown
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Verified and pending across each role
            </p>
          </div>
          <div className="grid gap-px bg-gray-100 sm:grid-cols-3">
            <OrgStat
              label="Restaurants"
              value={stats.totalRestaurants}
              icon={ShoppingBag}
              tone="bg-orange-50 text-orange-700"
            />
            <OrgStat
              label="NGOs"
              value={stats.totalNgos}
              icon={Users}
              tone="bg-blue-50 text-blue-700"
            />
            <OrgStat
              label="Animal rescues"
              value={stats.totalAnimalRescues}
              icon={Leaf}
              tone="bg-emerald-50 text-emerald-700"
            />
          </div>
        </div>

        {/* Action queue */}
        <div className="space-y-4">
          {stats.pendingVerificationRequests > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Action required
              </div>
              <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-amber-900">
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
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                All caught up
              </div>
              <p className="mt-1 text-sm text-emerald-900">
                No organizations are awaiting verification.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Quick links
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ActionTile
                to="/admin/organizations"
                icon={Building2}
                label="Organizations"
                tone="bg-blue-50 text-blue-700"
              />
              <ActionTile
                to="/admin/reports"
                icon={Flag}
                label="Reports"
                tone="bg-rose-50 text-rose-700"
              />
              <ActionTile
                to="/admin/claims"
                icon={ClipboardList}
                label="Claims"
                tone="bg-orange-50 text-orange-700"
              />
              <ActionTile
                to="/admin/users"
                icon={Users}
                label="Users"
                tone="bg-emerald-50 text-emerald-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof Building2
  tone: string
}) {
  return (
    <div className="bg-white px-6 py-5">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-gray-900">
        {value}
      </div>
    </div>
  )
}

function ActionTile({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string
  icon: typeof Building2
  label: string
  tone: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-medium text-gray-900">{label}</span>
    </Link>
  )
}
