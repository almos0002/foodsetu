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
import type { LucideIcon } from 'lucide-react'
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
import { greeting, todayLabel } from '../../../lib/time'

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

function AnimalDashboard() {
  const { nearby, myClaims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext()
  const canClaim = canManageAnimalClaims(user, organization)
  const activeClaims = myClaims.filter((c) => isClaimActive(c.status))
  const recentNearby = nearby.slice(0, 4)
  const orgName = organization?.name ?? user.name ?? 'there'

  return (
    <DashboardShell
      title="Animal rescue dashboard"
      roleLabel={ROLE_LABELS.ANIMAL_RESCUE}
      user={user}
      organization={organization}
    >
      <DashboardWelcomeBanner
        eyebrow="Animal rescue workspace"
        title={`${greeting()}, ${orgName}`}
        description="Pick up animal-safe surplus near you and reduce feed costs while diverting waste from landfill."
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

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <DashboardStatsCard
          label="Nearby available"
          value={canClaim ? nearby.length : '—'}
          icon={PawPrint}
          hint="Animal-safe surplus"
        />
        <DashboardStatsCard
          label="Active claims"
          value={canClaim ? activeClaims.length : '—'}
          icon={ShoppingBag}
          hint="Pending or in progress"
          to={canClaim ? '/animal/my-claims' : undefined}
        />
        <DashboardStatsCard
          label="Total claims"
          value={canClaim ? myClaims.length : '—'}
          icon={ListChecks}
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
          className="mt-6"
        >
          {!organization || organization.type !== 'ANIMAL_RESCUE'
            ? 'You need to own an animal-rescue organization to claim animal-safe food.'
            : 'Your organization must be verified before you can claim food.'}
        </Alert>
      ) : null}

      {canClaim ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHead
              title="Nearby right now"
              subtitle="Animal-safe listings sorted by distance"
              link={{ to: '/animal/nearby-food', label: 'View all' }}
            />
            {recentNearby.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-canvas-2)]">
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
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-5">
              <div className="tiny-cap text-[var(--color-ink-3)]">
                Quick actions
              </div>
              <div className="mt-3 space-y-1">
                <ActionRow
                  to="/animal/nearby-food"
                  icon={MapPin}
                  label="Nearby food"
                />
                <ActionRow
                  to="/animal/my-claims"
                  icon={ShoppingBag}
                  label="My claims"
                />
              </div>
            </div>

            {activeClaims.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line)] px-5 py-3">
                  <h3 className="text-[13px] font-semibold tracking-tight text-[var(--color-ink)]">
                    Active claims
                  </h3>
                  <Link
                    to="/animal/my-claims"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
                  >
                    All
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <ul className="divide-y divide-[var(--color-line)]">
                  {activeClaims.slice(0, 4).map((claim) => {
                    const status = claim.status as ClaimStatus
                    return (
                      <li
                        key={claim.id}
                        className="flex items-center gap-2 px-5 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-medium text-[var(--color-ink)]">
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

function SectionHead({
  title,
  subtitle,
  link,
}: {
  title: string
  subtitle: string
  link?: { to: string; label: string }
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-2)]">{subtitle}</p>
      </div>
      {link ? (
        <Link
          to={link.to}
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
        >
          {link.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  )
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
      className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-canvas-2)] hover:text-[var(--color-ink)]"
    >
      <Icon className="h-4 w-4 flex-shrink-0 text-[var(--color-ink-3)] group-hover:text-[var(--color-ink)]" />
      <span className="flex-1 truncate">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-ink-4)] transition-colors group-hover:text-[var(--color-ink-2)]" />
    </Link>
  )
}
