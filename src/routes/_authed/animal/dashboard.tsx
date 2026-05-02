import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  Calendar,
  ListChecks,
  MapPin,
  PawPrint,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { ClaimStatusBadge } from '../../../components/ui/ClaimStatusBadge'
import { DashboardListingCard } from '../../../components/ui/DashboardListingCard'
import { DashboardStatsCard } from '../../../components/ui/DashboardStatsCard'
import { DashboardWelcomeBanner } from '../../../components/ui/DashboardWelcomeBanner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatDistanceLong } from '../../../components/ui/FoodListingCard'
import {
  listMyAnimalClaimsFn,
  listNearbyAnimalFoodFn,
} from '../../../lib/claim-server'
import {
  ROLE_LABELS,
  canManageAnimalClaims,
  isClaimActive,
  roleToDashboard,
} from '../../../lib/permissions'
import type { ClaimStatus } from '../../../lib/permissions'

const BANNER_IMG =
  'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&auto=format&fit=crop&q=80'

export const Route = createFileRoute('/_authed/animal/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'ANIMAL_RESCUE' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) })
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

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function AnimalDashboard() {
  const { nearby, myClaims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext()
  const canClaim = canManageAnimalClaims(user, organization)
  const activeClaims = myClaims.filter((c) => isClaimActive(c.status))
  const recentNearby = nearby.slice(0, 4)
  const orgName = organization?.name ?? user.name ?? 'there'
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <DashboardShell
      title="Animal rescue dashboard"
      roleLabel={ROLE_LABELS.ANIMAL_RESCUE}
      user={user}
      organization={organization}
    >
      <DashboardWelcomeBanner
        tone="emerald"
        eyebrow="Animal rescue workspace"
        title={`${greeting}, ${orgName}`}
        description="Pick up animal-safe surplus near you and reduce feed costs while diverting waste from landfill."
        image={BANNER_IMG}
        chips={[
          { label: todayLabel(), icon: <Calendar className="h-3.5 w-3.5" /> },
        ]}
        actions={
          canClaim ? (
            <>
              <Link to="/animal/nearby-food">
                <Button leftIcon={<MapPin className="h-4 w-4" />}>
                  Browse nearby food
                </Button>
              </Link>
              <Link to="/animal/my-claims">
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <DashboardStatsCard
          label="Nearby available"
          value={canClaim ? nearby.length : '—'}
          icon={PawPrint}
          tone="green"
          hint="Animal-safe surplus"
        />
        <DashboardStatsCard
          label="Active claims"
          value={canClaim ? activeClaims.length : '—'}
          icon={ShoppingBag}
          tone="blue"
          hint="Pending or in progress"
          to={canClaim ? '/animal/my-claims' : undefined}
        />
        <DashboardStatsCard
          label="Total claims"
          value={canClaim ? myClaims.length : '—'}
          icon={ListChecks}
          tone="orange"
          hint="Lifetime"
          to={canClaim ? '/animal/my-claims' : undefined}
        />
      </div>

      {!canClaim ? (
        <Alert
          tone="warning"
          title={
            !organization || organization.type !== 'ANIMAL_RESCUE'
              ? 'Animal-rescue organization required'
              : 'Claiming is locked'
          }
          className="mt-5"
        >
          {!organization || organization.type !== 'ANIMAL_RESCUE'
            ? 'You need to own an animal-rescue organization to claim animal-safe food.'
            : 'Your organization must be verified before you can claim food.'}
        </Alert>
      ) : null}

      {canClaim ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                  Nearby right now
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Animal-safe listings sorted by distance
                </p>
              </div>
              <Link
                to="/animal/nearby-food"
                className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recentNearby.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                <EmptyState
                  bare
                  icon={Utensils}
                  title="No nearby food right now"
                  description="Check back soon — restaurants post throughout the day."
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {recentNearby.map((listing) => (
                  <DashboardListingCard
                    key={listing.id}
                    to="/animal/nearby-food"
                    imageUrl={listing.imageUrl}
                    title={listing.title}
                    primaryMeta={`${listing.quantity} ${listing.quantityUnit}`}
                    pickupAt={listing.pickupStartTime}
                    location={
                      listing.distanceKm != null
                        ? formatDistanceLong(listing.distanceKm)
                        : (listing.restaurantName ?? null)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Quick actions
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ActionTile
                  to="/animal/nearby-food"
                  icon={MapPin}
                  label="Nearby food"
                  tone="bg-orange-50 text-orange-700"
                />
                <ActionTile
                  to="/animal/my-claims"
                  icon={ShoppingBag}
                  label="My claims"
                  tone="bg-blue-50 text-blue-700"
                />
              </div>
            </div>

            {activeClaims.length > 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Active claims
                  </h3>
                  <Link
                    to="/animal/my-claims"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 underline-offset-4 hover:underline"
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

function ActionTile({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: string
  icon: typeof MapPin
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
