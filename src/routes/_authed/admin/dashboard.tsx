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
import { todayLabel } from '../../../lib/time'

export const Route = createFileRoute('/_authed/admin/dashboard')({
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
        tone="gray"
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
        <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white lg:col-span-2">
          <div className="border-b-[1.5px] border-[var(--color-line)] px-6 py-5">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--color-ink)]">
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
              chipBg="bg-[var(--color-coral-soft)]"
              chipFg="text-[var(--color-coral-ink)]"
              chipBorder="border-[var(--color-coral)]"
            />
            <OrgStat
              label="NGOs"
              value={stats.totalNgos}
              icon={Users}
              chipBg="bg-[var(--color-sky-soft)]"
              chipFg="text-[var(--color-sky-ink)]"
              chipBorder="border-[var(--color-sky)]"
            />
            <OrgStat
              label="Animal rescues"
              value={stats.totalAnimalRescues}
              icon={Leaf}
              chipBg="bg-[var(--color-mint-soft)]"
              chipFg="text-[var(--color-mint-ink)]"
              chipBorder="border-[var(--color-mint)]"
            />
          </div>
        </div>

        {/* Action queue */}
        <div className="space-y-4">
          {stats.pendingVerificationRequests > 0 ? (
            <div className="rounded-[28px] border-[1.5px] border-[var(--color-sun)] bg-[var(--color-sun-soft)] p-6">
              <div className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-[var(--color-sun)] text-[var(--color-ink)]">
                <Clock className="h-5 w-5" />
              </div>
              <div className="tiny-cap mt-4 text-[var(--color-sun-ink)]">
                Action required
              </div>
              <div className="font-display mt-2 text-4xl font-bold tracking-tight text-[var(--color-ink)]">
                {stats.pendingVerificationRequests}
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-2)]">
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
            <div className="rounded-[28px] border-[1.5px] border-[var(--color-mint)] bg-[var(--color-mint-soft)] p-6">
              <div className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-[var(--color-mint)] text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="tiny-cap mt-4 text-[var(--color-mint-ink)]">
                All caught up
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-2)]">
                No organizations are awaiting verification.
              </p>
            </div>
          )}

          <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white p-6">
            <div className="tiny-cap text-[var(--color-ink-3)]">
              Quick links
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <ActionTile
                to="/admin/organizations"
                icon={Building2}
                label="Organizations"
                bg="bg-[var(--color-sky-soft)]"
                fg="text-[var(--color-sky-ink)]"
                border="border-[var(--color-sky)]"
              />
              <ActionTile
                to="/admin/reports"
                icon={Flag}
                label="Reports"
                bg="bg-[var(--color-berry-soft)]"
                fg="text-[var(--color-berry-ink)]"
                border="border-[var(--color-berry)]"
              />
              <ActionTile
                to="/admin/claims"
                icon={ClipboardList}
                label="Claims"
                bg="bg-[var(--color-coral-soft)]"
                fg="text-[var(--color-coral-ink)]"
                border="border-[var(--color-coral)]"
              />
              <ActionTile
                to="/admin/users"
                icon={Users}
                label="Users"
                bg="bg-[var(--color-mint-soft)]"
                fg="text-[var(--color-mint-ink)]"
                border="border-[var(--color-mint)]"
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
          tone={stats.pendingVerificationRequests > 0 ? 'amber' : 'default'}
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
  chipBg,
  chipFg,
  chipBorder,
}: {
  label: string
  value: number
  icon: typeof Building2
  chipBg: string
  chipFg: string
  chipBorder: string
}) {
  return (
    <div className="bg-white px-6 py-6">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-9 w-9 -rotate-3 items-center justify-center rounded-2xl border-[1.5px] ${chipBorder} ${chipBg} ${chipFg}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="tiny-cap text-[var(--color-ink-3)]">{label}</div>
      </div>
      <div className="font-display mt-3 text-4xl font-bold tabular-nums tracking-tight text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  )
}

function ActionTile({
  to,
  icon: Icon,
  label,
  bg,
  fg,
  border,
}: {
  to: string
  icon: typeof Building2
  label: string
  bg: string
  fg: string
  border: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start gap-2 rounded-2xl border-[1.5px] border-[var(--color-line)] bg-white p-3 transition-transform hover:-translate-y-0.5 hover:border-[var(--color-line-strong)]"
    >
      <div
        className={`flex h-9 w-9 -rotate-3 items-center justify-center rounded-2xl border-[1.5px] ${border} ${bg} ${fg}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-bold text-[var(--color-ink)]">{label}</span>
    </Link>
  )
}
