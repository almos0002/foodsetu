import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { ClaimStatusBadge } from '../../../components/ui/ClaimStatusBadge'
import { DashboardStatsCard } from '../../../components/ui/DashboardStatsCard'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatDistanceLong } from '../../../components/ui/FoodListingCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import {
  listMyClaimsFn,
  listNearbyHumanFoodFn,
} from '../../../lib/claim-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  ROLE_LABELS,
  canManageNgoClaims,
  isClaimActive,
  roleToDashboard,
  type ClaimStatus,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/ngo/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => {
    const [nearby, myClaims] = await Promise.all([
      listNearbyHumanFoodFn().catch(() => []),
      listMyClaimsFn().catch(() => []),
    ])
    return { nearby, myClaims }
  },
  component: NgoDashboard,
})

function NgoDashboard() {
  const { nearby, myClaims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const canClaim = canManageNgoClaims(user, organization)
  const activeClaims = myClaims.filter((c) => isClaimActive(c.status))
  const recentNearby = nearby.slice(0, 5)

  return (
    <DashboardShell
      title="NGO dashboard"
      roleLabel={ROLE_LABELS.NGO}
      user={user}
      organization={organization}
    >
      <PageHeader
        eyebrow={
          organization?.name ? `Welcome back, ${organization.name}` : 'Workspace'
        }
        title="Overview"
        description="Find and claim nearby surplus food in real time."
        actions={
          canClaim ? (
            <Link to="/ngo/nearby-food">
              <Button leftIcon={<MapPin className="h-4 w-4" />}>
                Browse nearby food
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <DashboardStatsCard
          label="Nearby available"
          value={canClaim ? nearby.length : '—'}
          icon={Utensils}
          tone="green"
          hint="Listings within your range"
        />
        <DashboardStatsCard
          label="Active claims"
          value={canClaim ? activeClaims.length : '—'}
          icon={ShoppingBag}
          tone="blue"
          hint="Pending or in progress"
          to={canClaim ? '/ngo/my-claims' : undefined}
        />
        <DashboardStatsCard
          label="Total claims"
          value={canClaim ? myClaims.length : '—'}
          icon={ShoppingBag}
          tone="default"
          hint="Lifetime"
          to={canClaim ? '/ngo/my-claims' : undefined}
        />
      </div>

      {!canClaim ? (
        <Alert tone="warning" title="Claiming is locked" className="mt-5">
          Your organization must be verified before you can claim food.
        </Alert>
      ) : null}

      {canClaim ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white lg:col-span-2">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Nearby right now
                </h2>
                <p className="text-xs text-gray-500">
                  Fresh listings sorted by distance
                </p>
              </div>
              <Link
                to="/ngo/nearby-food"
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recentNearby.length === 0 ? (
              <EmptyState
                bare
                icon={Utensils}
                title="No nearby food right now"
                description="Check back soon — restaurants post throughout the day."
              />
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentNearby.map((listing) => (
                  <li
                    key={listing.id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {listing.title}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        <span className="tabular-nums">
                          {listing.quantity} {listing.quantityUnit}
                        </span>
                        {listing.restaurantName
                          ? ` · ${listing.restaurantName}`
                          : ''}
                        {listing.distanceKm != null
                          ? ` · ${formatDistanceLong(listing.distanceKm)}`
                          : ''}
                      </div>
                    </div>
                    <Link
                      to="/ngo/nearby-food"
                      className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                    >
                      Open
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                Quick actions
              </div>
              <div className="mt-3 space-y-2">
                <Link to="/ngo/nearby-food" className="block">
                  <Button
                    fullWidth
                    leftIcon={<MapPin className="h-4 w-4" />}
                  >
                    Browse nearby food
                  </Button>
                </Link>
                <Link to="/ngo/my-claims" className="block">
                  <Button
                    fullWidth
                    variant="outline"
                    leftIcon={<ShoppingBag className="h-4 w-4" />}
                  >
                    My claims
                  </Button>
                </Link>
              </div>
            </div>

            {activeClaims.length > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Active claims
                  </h3>
                  <Link
                    to="/ngo/my-claims"
                    className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    All
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <ul className="divide-y divide-gray-100">
                  {activeClaims.slice(0, 4).map((claim) => {
                    const status = claim.status as ClaimStatus
                    return (
                      <li
                        key={claim.id}
                        className="flex items-center gap-2 px-5 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-gray-900">
                            {claim.listing.title}
                          </div>
                        </div>
                        <ClaimStatusBadge status={status} size="sm" />
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </DashboardShell>
  )
}
