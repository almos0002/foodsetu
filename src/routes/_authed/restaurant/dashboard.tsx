import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  History,
  Inbox,
  ListChecks,
  MapPin,
  Plus,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { ListingStatusBadge } from '../../../components/ui/ClaimStatusBadge'
import { DashboardListingCard } from '../../../components/ui/DashboardListingCard'
import { DashboardStatsCard } from '../../../components/ui/DashboardStatsCard'
import { DashboardWelcomeBanner } from '../../../components/ui/DashboardWelcomeBanner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { listClaimRequestsForRestaurantFn } from '../../../lib/claim-server'
import { listMyListingsFn } from '../../../lib/listing-server'
import {
  ROLE_LABELS,
  canCreateFoodListing,
  isOrgVerified,
  roleToDashboard,
} from '../../../lib/permissions'
import { greeting, todayLabel } from '../../../lib/time'

export const Route = createFileRoute('/_authed/restaurant/dashboard')({
  head: () => ({ meta: [{ title: 'Restaurant dashboard | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) })
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
  const { user, organization } = Route.useRouteContext()
  const verified = isOrgVerified(organization)
  const canPost = canCreateFoodListing(user, organization)
  const recent = active.slice(0, 4)
  const pendingClaims = activeClaims.filter((c) => c.status === 'PENDING')
  const acceptedClaims = activeClaims.length - pendingClaims.length
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
        title={`${greeting()}, ${orgName}`}
        description="Surplus food, claims, and pickups at a glance. Post fresh listings the moment your kitchen has extra."
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

      {organization && (organization.latitude == null || organization.longitude == null) ? (
        <Alert tone="warning" title="Set your pickup location" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Without a location, partners nearby won&apos;t see your listings.
              Set it once in settings.
            </span>
            <Link to="/settings/organization">
              <Button size="sm" leftIcon={<MapPin className="h-4 w-4" />}>
                Set your location
              </Button>
            </Link>
          </div>
        </Alert>
      ) : null}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          label="Active listings"
          value={active.length}
          icon={ShoppingBag}
          to="/restaurant/listings"
          hint="Live and visible to partners"
        />
        <DashboardStatsCard
          label="Pending claims"
          value={pendingClaims.length}
          icon={Inbox}
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
          hint="Listings + open claims"
        />
        <DashboardStatsCard
          label="Past listings"
          value={history.length}
          icon={History}
          to="/restaurant/listings"
          hint="Completed or cancelled"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent listings */}
        <div className="lg:col-span-2">
          <SectionHead
            title="Recent listings"
            subtitle="The latest surplus posted by your kitchen"
            link={{ to: '/restaurant/listings', label: 'View all' }}
          />

          {recent.length === 0 ? (
            <div className="mt-4 squircle border border-dashed border-[var(--color-line)] bg-[var(--color-canvas-2)]">
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
                const status = row.status
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
          <ClaimStatusPanel
            pendingCount={pendingClaims.length}
            acceptedCount={acceptedClaims}
          />
        </div>
      </div>
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

function QuickActionsPanel({ canPost }: { canPost: boolean }) {
  return (
    <div className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] p-5">
      <div className="tiny-cap text-[var(--color-ink-3)]">Quick actions</div>
      <div className="mt-3 space-y-1">
        {canPost ? (
          <ActionRow
            to="/restaurant/listings/new"
            icon={Plus}
            label="New listing"
          />
        ) : null}
        <ActionRow
          to="/restaurant/claims"
          icon={ClipboardList}
          label="Claim requests"
        />
        <ActionRow
          to="/restaurant/listings"
          icon={ShoppingBag}
          label="All listings"
        />
      </div>
    </div>
  )
}

function ClaimStatusPanel({
  pendingCount,
  acceptedCount,
}: {
  pendingCount: number
  acceptedCount: number
}) {
  if (pendingCount > 0) {
    return (
      <div className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] p-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 squircle bg-[var(--color-warn)]" />
          <div className="tiny-cap text-[var(--color-ink-3)]">
            Needs attention
          </div>
        </div>
        <div className="mt-3 text-[26px] font-semibold leading-none tabular-nums tracking-tight text-[var(--color-ink)]">
          {pendingCount}
        </div>
        <p className="mt-2 text-sm text-[var(--color-ink-2)]">
          new claim request{pendingCount === 1 ? '' : 's'} awaiting your
          decision.
        </p>
        <Link
          to="/restaurant/claims"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-ink-2)]"
        >
          Review now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    )
  }
  return (
    <div className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] p-5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 squircle bg-[var(--color-accent)]" />
        <div className="tiny-cap text-[var(--color-ink-3)]">All caught up</div>
      </div>
      <p className="mt-3 text-sm text-[var(--color-ink-2)]">
        No pending claim requests right now.
        {acceptedCount > 0
          ? ` ${acceptedCount} claim${acceptedCount === 1 ? '' : 's'} in progress.`
          : ''}
      </p>
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
      className="group flex items-center gap-2.5 squircle px-2 py-1.5 text-[13px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-canvas-2)] hover:text-[var(--color-ink)]"
    >
      <Icon className="h-4 w-4 flex-shrink-0 text-[var(--color-ink-3)] group-hover:text-[var(--color-ink)]" />
      <span className="flex-1 truncate">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-ink-4)] transition-colors group-hover:text-[var(--color-ink-2)]" />
    </Link>
  )
}
