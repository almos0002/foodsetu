import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Flag,
  Leaf,
  PackageCheck,
  ShoppingBag,
  Users,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { Button } from '../../../components/ui/Button'
import { DashboardStatsCard } from '../../../components/ui/DashboardStatsCard'
import { DashboardWelcomeBanner } from '../../../components/ui/DashboardWelcomeBanner'
import { getAdminStatsFn } from '../../../lib/admin-server'
import { canAccessAdmin, roleToDashboard } from '../../../lib/permissions'
import { todayLabel } from '../../../lib/time'

export const Route = createFileRoute('/_authed/admin/dashboard')({
  head: () => ({ meta: [{ title: 'Admin overview | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) })
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
  const { user } = Route.useRouteContext()

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
        eyebrow="Platform overview"
        title="Network health at a glance"
        description="Organizations, listings, pickups and verifications across every city FoodSetu operates in."
        chips={[
          { label: todayLabel(), icon: <Calendar className="h-3.5 w-3.5" /> },
          {
            label: `${totalOrgs} organizations`,
            icon: <Building2 className="h-3.5 w-3.5" />,
          },
        ]}
        actions={
          <>
            <Link to="/admin/users">
              <Button leftIcon={<Users className="h-4 w-4" />}>
                Manage users
              </Button>
            </Link>
            <Link to="/admin/organizations">
              <Button variant="outline" leftIcon={<Building2 className="h-4 w-4" />}>
                Organizations
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="outline" leftIcon={<Flag className="h-4 w-4" />}>
                Reports
              </Button>
            </Link>
          </>
        }
      />

      {/* Headline KPIs */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          label="Total users"
          value={stats.totalUsers}
          icon={Users}
          to="/admin/users"
          hint="Across all roles"
        />
        <DashboardStatsCard
          label="Organizations"
          value={totalOrgs}
          icon={Building2}
          to="/admin/organizations"
          hint="Restaurants, NGOs, rescues"
        />
        <DashboardStatsCard
          label="Active listings"
          value={stats.activeListings}
          icon={ShoppingBag}
          to="/admin/listings"
          hint="Available, requested, claimed"
        />
        <DashboardStatsCard
          label="Completed pickups"
          value={stats.completedPickups}
          icon={PackageCheck}
          to="/admin/listings"
          hint="Lifetime"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Org breakdown panel */}
        <div className="overflow-hidden squircle border border-[var(--color-line)] bg-[var(--color-canvas)] lg:col-span-2">
          <div className="border-b border-[var(--color-line)] px-6 py-4">
            <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">
              Organization breakdown
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-2)]">
              Verified and pending across each role
            </p>
          </div>
          <div className="grid gap-px bg-[var(--color-line)] sm:grid-cols-3">
            <OrgStat
              label="Restaurants"
              value={stats.totalRestaurants}
              icon={ShoppingBag}
              to="/admin/organizations"
            />
            <OrgStat
              label="NGOs"
              value={stats.totalNgos}
              icon={Users}
              to="/admin/organizations"
            />
            <OrgStat
              label="Animal rescues"
              value={stats.totalAnimalRescues}
              icon={Leaf}
              to="/admin/organizations"
            />
          </div>
        </div>

        {/* Action queue */}
        <div className="space-y-4">
          {stats.pendingVerificationRequests > 0 ? (
            <div className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] p-5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 squircle bg-[var(--color-warn)]" />
                <div className="tiny-cap text-[var(--color-ink-3)]">
                  Action required
                </div>
              </div>
              <div className="mt-3 text-[26px] font-semibold leading-none tabular-nums tracking-tight text-[var(--color-ink)]">
                {stats.pendingVerificationRequests}
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-2)]">
                organization
                {stats.pendingVerificationRequests === 1 ? '' : 's'} awaiting
                verification
              </p>
              <Link to="/admin/organizations" className="mt-4 inline-block">
                <Button
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Review now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] p-5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 squircle bg-[var(--color-accent)]" />
                <div className="tiny-cap text-[var(--color-ink-3)]">
                  All caught up
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--color-ink-2)]">
                No organizations are awaiting verification.
              </p>
            </div>
          )}

          <div className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] p-5">
            <div className="tiny-cap text-[var(--color-ink-3)]">
              Quick links
            </div>
            <div className="mt-3 space-y-1">
              <ActionRow
                to="/admin/organizations"
                icon={Building2}
                label="Organizations"
              />
              <ActionRow to="/admin/reports" icon={Flag} label="Reports" />
              <ActionRow
                to="/admin/claims"
                icon={ShoppingBag}
                label="Claims"
              />
              <ActionRow to="/admin/users" icon={Users} label="Users" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <DashboardStatsCard
          label="Expired listings"
          value={stats.expiredListings}
          icon={XCircle}
          to="/admin/listings"
          hint="Time-window passed"
        />
        <DashboardStatsCard
          label="Pending verifications"
          value={stats.pendingVerificationRequests}
          icon={Clock}
          to="/admin/organizations"
          hint="Orgs awaiting review"
        />
        <DashboardStatsCard
          label="Rescued food"
          value={rescuedSummary}
          icon={Leaf}
          to="/admin/listings"
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
  to,
}: {
  label: string
  value: number
  icon: LucideIcon
  to?: string
}) {
  const inner = (
    <div className="bg-[var(--color-canvas)] px-6 py-5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[var(--color-ink-3)]" />
        <div className="tiny-cap text-[var(--color-ink-3)]">{label}</div>
      </div>
      <div className="font-display mt-3 text-[26px] font-semibold leading-none tabular-nums tracking-tight text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  )
  if (to) {
    return (
      <Link to={to} className="block transition-colors hover:bg-[var(--color-canvas-2)]">
        {inner}
      </Link>
    )
  }
  return inner
}

function ActionRow({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: LucideIcon
  label: string
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2.5 squircle px-2 py-1.5 text-[13px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-canvas-2)] hover:text-[var(--color-ink)]"
    >
      <Icon className="h-4 w-4 flex-shrink-0 text-[var(--color-ink-3)] group-hover:text-[var(--color-ink)]" />
      <span className="flex-1 truncate">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-ink-4)] transition-colors group-hover:text-[var(--color-ink-2)]" />
    </Link>
  )
}
