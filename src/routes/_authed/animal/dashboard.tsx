import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { ChevronRight, MapPin, PawPrint, ShoppingBag } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { StatCard } from '../../../components/food/ClaimDashboardWidgets'
import { formatDistanceLong } from '../../../components/food/NearbyFoodCard'
import {
  listMyAnimalClaimsFn,
  listNearbyAnimalFoodFn,
} from '../../../lib/claim-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  CLAIM_STATUS_BADGE_CLASSES,
  CLAIM_STATUS_LABELS,
  ROLE_LABELS,
  canManageAnimalClaims,
  isClaimActive,
  roleToDashboard,
  type ClaimStatus,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/animal/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'ANIMAL_RESCUE' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => {
    const [nearby, myClaims] = await Promise.all([
      listNearbyAnimalFoodFn().catch(() => []),
      listMyAnimalClaimsFn().catch(() => []),
    ])
    return { nearby, myClaims }
  },
  component: AnimalDashboard,
})

function AnimalDashboard() {
  const { nearby, myClaims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const canClaim = canManageAnimalClaims(user, organization)
  const activeClaims = myClaims.filter((c) => isClaimActive(c.status))
  const recentNearby = nearby.slice(0, 5)

  return (
    <DashboardShell
      title="Animal rescue dashboard"
      roleLabel={ROLE_LABELS.ANIMAL_RESCUE}
      user={user}
      organization={organization}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<PawPrint className="h-4 w-4" />}
          label="Nearby available"
          value={canClaim ? nearby.length : '—'}
          accent="text-emerald-700 bg-emerald-50 ring-emerald-100"
        />
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Active claims"
          value={canClaim ? activeClaims.length : '—'}
          accent="text-blue-700 bg-blue-50 ring-blue-100"
        />
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Total claims"
          value={canClaim ? myClaims.length : '—'}
          accent="text-gray-700 bg-gray-50 ring-gray-100"
        />
      </div>

      {canClaim ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            to="/animal/nearby-food"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            <MapPin className="h-4 w-4" />
            Browse nearby food
          </Link>
          <Link
            to="/animal/my-claims"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ShoppingBag className="h-4 w-4" />
            My claims
          </Link>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          {!organization || organization.type !== 'ANIMAL_RESCUE'
            ? 'You need to own an animal-rescue organization to claim animal-safe food.'
            : 'Claiming food is locked until your organization is verified.'}
        </div>
      )}

      {canClaim ? (
        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Nearby right now
            </h2>
            <Link
              to="/animal/nearby-food"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {recentNearby.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500">
                No animal-safe food available nearby right now. Check back soon.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentNearby.map((listing) => (
                  <li key={listing.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {listing.title}
                      </div>
                      <div className="text-xs text-gray-500">
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
                      to="/animal/nearby-food"
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
        </section>
      ) : null}

      {canClaim && activeClaims.length > 0 ? (
        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Your active claims
            </h2>
            <Link
              to="/animal/my-claims"
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <ul className="divide-y divide-gray-100">
              {activeClaims.slice(0, 5).map((claim) => {
                const status = claim.status as ClaimStatus
                return (
                  <li key={claim.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {claim.listing.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {claim.listing.quantity} {claim.listing.quantityUnit}
                        {claim.listing.restaurantName
                          ? ` · ${claim.listing.restaurantName}`
                          : ''}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLAIM_STATUS_BADGE_CLASSES[status] ?? ''}`}
                    >
                      {CLAIM_STATUS_LABELS[status] ?? status}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </DashboardShell>
  )
}
