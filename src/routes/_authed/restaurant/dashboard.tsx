import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  History,
  Inbox,
  ListChecks,
  Plus,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Button } from '../../../components/ui/Button'
import { ListingStatusBadge } from '../../../components/ui/ClaimStatusBadge'
import { DashboardListingCard } from '../../../components/ui/DashboardListingCard'
import { DashboardStatsCard } from '../../../components/ui/DashboardStatsCard'
import { DashboardWelcomeBanner } from '../../../components/ui/DashboardWelcomeBanner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { listClaimRequestsForRestaurantFn } from '../../../lib/claim-server'
import { listMyListingsFn } from '../../../lib/listing-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  ROLE_LABELS,
  canCreateFoodListing,
  isOrgVerified,
  roleToDashboard,
  type ListingStatus,
} from '../../../lib/permissions'

const BANNER_IMG =
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=900&auto=format&fit=crop&q=80'

export const Route = createFileRoute('/_authed/restaurant/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => {
    const [active, history, activeClaims] = await Promise.all([
      listMyListingsFn({ data: { scope: 'active' } }),
      listMyListingsFn({ data: { scope: 'history' } }),
      listClaimRequestsForRestaurantFn({ data: { scope: 'active' } }).catch(
        () => [],
      ),
    ])
    return { active, history, activeClaims }
  },
  component: RestaurantDashboard,
})

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function RestaurantDashboard() {
  const { active, history, activeClaims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const verified = isOrgVerified(organization)
  const canPost = canCreateFoodListing(user, organization)
  const recent = active.slice(0, 4)
  const pendingClaims = activeClaims.filter((c) => c.status === 'PENDING')
  const acceptedClaims = activeClaims.length - pendingClaims.length
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()
  const orgName = organization?.name ?? user.name ?? 'there'

  return (
    <DashboardShell
      title="Restaurant dashboard"
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <DashboardWelcomeBanner
        eyebrow="Restaurant workspace"
        title={`${greeting}, ${orgName}`}
        description="Surplus food, claims, and pickups at a glance. Post fresh listings the moment your kitchen has extra."
        image={BANNER_IMG}
        chips={[
          { label: todayLabel(), icon: <Calendar className="h-3.5 w-3.5" /> },
        ]}
        actions={
          canPost ? (
            <>
              <Link to="/restaurant/listings/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  New listing
                </Button>
              </Link>
              <Link to="/restaurant/claims">
                <Button
                  variant="outline"
                  leftIcon={<ClipboardList className="h-4 w-4" />}
                >
                  Claim requests
                </Button>
              </Link>
            </>
          ) : null
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          label="Active listings"
          value={active.length}
          icon={ShoppingBag}
          tone="orange"
          to="/restaurant/listings"
          hint="Live and visible to partners"
        />
        <DashboardStatsCard
          label="Pending claims"
          value={pendingClaims.length}
          icon={Inbox}
          tone="amber"
          to="/restaurant/claims"
          hint={
            acceptedClaims > 0
              ? `${acceptedClaims} accepted in progress`
              : 'Awaiting your response'
          }
        />
        <DashboardStatsCard
          label="In pipeline"
          value={active.length + activeClaims.length}
          icon={ListChecks}
          tone="blue"
          hint="Listings + open claims"
        />
        <DashboardStatsCard
          label="Past listings"
          value={history.length}
          icon={History}
          tone="default"
          to="/restaurant/listings"
          hint="Completed or cancelled"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Recent listings as photo cards */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                Recent listings
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                The latest surplus posted by your kitchen
              </p>
            </div>
            <Link
              to="/restaurant/listings"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50">
              <EmptyState
                bare
                icon={Utensils}
                title={
                  canPost
                    ? 'No active listings yet'
                    : verified
                      ? 'No active listings yet'
                      : 'Posting is locked'
                }
                description={
                  canPost
                    ? 'Post your first surplus food listing to get started.'
                    : verified
                      ? 'Once you post a listing it will show up here.'
                      : 'Verification of your organization is required before you can post.'
                }
                action={
                  canPost ? (
                    <Link to="/restaurant/listings/new">
                      <Button leftIcon={<Plus className="h-4 w-4" />}>
                        Create listing
                      </Button>
                    </Link>
                  ) : null
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {recent.map((row) => {
                const status = row.status as ListingStatus
                return (
                  <DashboardListingCard
                    key={row.id}
                    to={`/restaurant/listings/${row.id}`}
                    imageUrl={row.imageUrl}
                    title={row.title}
                    badge={<ListingStatusBadge status={status} size="sm" />}
                    primaryMeta={`${row.quantity} ${row.quantityUnit}`}
                    pickupAt={row.pickupStartTime}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <QuickActionsPanel canPost={canPost} />

          {pendingClaims.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Inbox className="h-5 w-5" />
              </div>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Needs your attention
              </div>
              <p className="mt-1 text-sm text-amber-900">
                <span className="text-2xl font-semibold tabular-nums">
                  {pendingClaims.length}
                </span>{' '}
                new claim request
                {pendingClaims.length === 1 ? '' : 's'} awaiting your decision.
              </p>
              <Link
                to="/restaurant/claims"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-800 underline-offset-4 hover:underline"
              >
                Review now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ListChecks className="h-5 w-5" />
              </div>
              <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                All caught up
              </div>
              <p className="mt-1 text-sm text-emerald-900">
                No pending claim requests right now.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

function QuickActionsPanel({ canPost }: { canPost: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        Quick actions
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {canPost ? (
          <ActionTile
            to="/restaurant/listings/new"
            icon={Plus}
            label="New listing"
            tone="bg-orange-50 text-orange-700"
          />
        ) : null}
        <ActionTile
          to="/restaurant/claims"
          icon={ClipboardList}
          label="Claim requests"
          tone="bg-blue-50 text-blue-700"
        />
        <ActionTile
          to="/restaurant/listings"
          icon={ShoppingBag}
          label="All listings"
          tone="bg-emerald-50 text-emerald-700"
        />
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
  icon: typeof Plus
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
