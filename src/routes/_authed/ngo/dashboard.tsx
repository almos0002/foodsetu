import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  Calendar,
  ListChecks,
  MapPin,
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
  listMyClaimsFn,
  listNearbyHumanFoodFn,
} from '../../../lib/claim-server'
import {
  ROLE_LABELS,
  canManageNgoClaims,
  isClaimActive,
  roleToDashboard,
} from '../../../lib/permissions'
import type { ClaimStatus } from '../../../lib/permissions'
import { greeting, todayLabel } from '../../../lib/time'

export const Route = createFileRoute('/_authed/ngo/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) })
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
  const { user, organization } = Route.useRouteContext()
  const canClaim = canManageNgoClaims(user, organization)
  const activeClaims = myClaims.filter((c) => isClaimActive(c.status))
  const recentNearby = nearby.slice(0, 4)
  const orgName = organization?.name ?? user.name ?? 'there'

  return (
    <DashboardShell
      title="NGO dashboard"
      roleLabel={ROLE_LABELS.NGO}
      user={user}
      organization={organization}
    >
      <DashboardWelcomeBanner
        tone="rose"
        eyebrow="NGO workspace"
        title={`${greeting()}, ${orgName}`}
        description="Find and claim nearby surplus food in real time. Reach families and shelters with fresh meals every day."
        chips={[
          { label: todayLabel(), icon: <Calendar className="h-3.5 w-3.5" /> },
        ]}
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
          icon={ListChecks}
          tone="orange"
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
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                  Nearby right now
                </h2>
                <p className="mt-1 text-sm text-[var(--color-ink-2)]">
                  Fresh listings sorted by distance
                </p>
              </div>
              <Link
                to="/ngo/nearby-food"
                className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-ink)] hover:text-[var(--color-coral)]"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {recentNearby.length === 0 ? (
              <div className="dotgrid mt-4 rounded-[28px] border-[1.5px] border-dashed border-[var(--color-line-strong)] bg-[var(--color-cream)]">
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
                    to="/ngo/nearby-food"
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
            <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white p-6">
              <div className="tiny-cap text-[var(--color-ink-3)]">
                Quick actions
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <ActionTile
                  to="/ngo/nearby-food"
                  icon={MapPin}
                  label="Nearby food"
                  bg="bg-[var(--color-coral-soft)]"
                  fg="text-[var(--color-coral-ink)]"
                  border="border-[var(--color-coral)]"
                />
                <ActionTile
                  to="/ngo/my-claims"
                  icon={ShoppingBag}
                  label="My claims"
                  bg="bg-[var(--color-sky-soft)]"
                  fg="text-[var(--color-sky-ink)]"
                  border="border-[var(--color-sky)]"
                />
              </div>
            </div>

            {activeClaims.length > 0 ? (
              <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white">
                <div className="flex items-center justify-between gap-2 border-b-[1.5px] border-[var(--color-line)] px-6 py-4">
                  <h3 className="font-display text-base font-bold text-[var(--color-ink)]">
                    Active claims
                  </h3>
                  <Link
                    to="/ngo/my-claims"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-ink)] hover:text-[var(--color-coral)]"
                  >
                    All
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <ul className="divide-y-[1.5px] divide-[var(--color-line)]">
                  {activeClaims.slice(0, 4).map((claim) => {
                    const status = claim.status as ClaimStatus
                    return (
                      <li
                        key={claim.id}
                        className="flex items-center gap-2 px-6 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-[var(--color-ink)]">
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
  bg,
  fg,
  border,
}: {
  to: string
  icon: typeof MapPin
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
