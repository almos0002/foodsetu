import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronRight,
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
import { DashboardStatsCard } from '../../../components/ui/DashboardStatsCard'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
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

function RestaurantDashboard() {
  const { active, history, activeClaims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const verified = isOrgVerified(organization)
  const canPost = canCreateFoodListing(user, organization)
  const recent = active.slice(0, 5)
  const pendingClaims = activeClaims.filter((c) => c.status === 'PENDING')
  const acceptedClaims = activeClaims.length - pendingClaims.length

  return (
    <DashboardShell
      title="Restaurant dashboard"
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <PageHeader
        eyebrow={
          organization?.name ? `Welcome back, ${organization.name}` : 'Workspace'
        }
        title="Overview"
        description="Surplus food, claims, and pickups at a glance."
        actions={
          canPost ? (
            <Link to="/restaurant/listings/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                New listing
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Recent listings */}
        <div className="rounded-lg border border-gray-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Recent listings
              </h2>
              <p className="text-xs text-gray-500">
                Latest surplus posted by your kitchen
              </p>
            </div>
            <Link
              to="/restaurant/listings"
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
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
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((row) => {
                const status = row.status as ListingStatus
                return (
                  <li key={row.id}>
                    <Link
                      to="/restaurant/listings/$id"
                      params={{ id: row.id }}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {row.title}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          <span className="tabular-nums">
                            {row.quantity} {row.quantityUnit}
                          </span>
                          {' · pickup '}
                          <span className="tabular-nums">
                            {new Date(row.pickupStartTime).toLocaleString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              },
                            )}
                          </span>
                        </div>
                      </div>
                      <ListingStatusBadge status={status} size="sm" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
              Quick actions
            </div>
            <div className="mt-3 space-y-2">
              {canPost ? (
                <Link to="/restaurant/listings/new" className="block">
                  <Button
                    fullWidth
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    New listing
                  </Button>
                </Link>
              ) : null}
              <Link to="/restaurant/claims" className="block">
                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={<ClipboardList className="h-4 w-4" />}
                >
                  Review claim requests
                </Button>
              </Link>
              <Link to="/restaurant/listings" className="block">
                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={<ShoppingBag className="h-4 w-4" />}
                >
                  Manage listings
                </Button>
              </Link>
            </div>
          </div>

          {pendingClaims.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700">
                Needs your attention
              </div>
              <p className="mt-2 text-sm text-amber-900">
                <span className="font-semibold tabular-nums">
                  {pendingClaims.length}
                </span>{' '}
                new claim request
                {pendingClaims.length === 1 ? '' : 's'} awaiting your decision.
              </p>
              <Link
                to="/restaurant/claims"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900"
              >
                Review now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                All caught up
              </div>
              <p className="mt-2 text-sm text-gray-700">
                No pending claim requests right now.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
