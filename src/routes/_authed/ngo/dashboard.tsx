import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ChevronRight,
  MapPin,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
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
        title="NGO dashboard"
        description={
          organization?.name
            ? `Welcome back, ${organization.name}`
            : 'Find and claim nearby surplus food'
        }
        actions={
          canClaim ? (
            <>
              <Link to="/ngo/nearby-food">
                <Button leftIcon={<MapPin className="h-4 w-4" />}>
                  Browse nearby food
                </Button>
              </Link>
              <Link to="/ngo/my-claims">
                <Button
                  variant="outline"
                  leftIcon={<ShoppingBag className="h-4 w-4" />}
                >
                  My claims
                </Button>
              </Link>
            </>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <DashboardStatsCard
          label="Nearby available"
          value={canClaim ? nearby.length : '—'}
          icon={Utensils}
          tone="green"
        />
        <DashboardStatsCard
          label="Active claims"
          value={canClaim ? activeClaims.length : '—'}
          icon={ShoppingBag}
          tone="blue"
        />
        <DashboardStatsCard
          label="Total claims"
          value={canClaim ? myClaims.length : '—'}
          icon={ShoppingBag}
          tone="default"
        />
      </div>

      {!canClaim ? (
        <Alert tone="warning" title="Claiming is locked" className="mt-5">
          Your organization must be verified before you can claim food.
        </Alert>
      ) : null}

      {canClaim ? (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Nearby right now</CardTitle>
              <Link
                to="/ngo/nearby-food"
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
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
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {listing.title}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {listing.quantity} {listing.quantityUnit}
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
        </Card>
      ) : null}

      {canClaim && activeClaims.length > 0 ? (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Your active claims</CardTitle>
              <Link
                to="/ngo/my-claims"
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <ul className="divide-y divide-gray-100">
            {activeClaims.slice(0, 5).map((claim) => {
              const status = claim.status as ClaimStatus
              return (
                <li
                  key={claim.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {claim.listing.title}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {claim.listing.quantity} {claim.listing.quantityUnit}
                      {claim.listing.restaurantName
                        ? ` · ${claim.listing.restaurantName}`
                        : ''}
                    </div>
                  </div>
                  <ClaimStatusBadge status={status} size="sm" />
                </li>
              )
            })}
          </ul>
        </Card>
      ) : null}
    </DashboardShell>
  )
}
