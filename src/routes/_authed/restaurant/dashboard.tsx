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
import {
  ROLE_LABELS,
  canCreateFoodListing,
  isOrgVerified,
  roleToDashboard,
} from '../../../lib/permissions'
import { greeting, todayLabel } from '../../../lib/time'

export const Route = createFileRoute('/_authed/restaurant/dashboard')({
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
        {/* Recent listings */}
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                Recent listings
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-2)]">
                The latest surplus posted by your kitchen
              </p>
            </div>
            <Link
              to="/restaurant/listings"
              className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-ink)] hover:text-[var(--color-coral)]"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="dotgrid mt-4 rounded-[28px] border-[1.5px] border-dashed border-[var(--color-line-strong)] bg-[var(--color-cream)]">
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

          {pendingClaims.length > 0 ? (
            <div className="rounded-[28px] border-[1.5px] border-[var(--color-sun)] bg-[var(--color-sun-soft)] p-6">
              <div className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-[var(--color-sun)] text-[var(--color-ink)]">
                <Inbox className="h-5 w-5" />
              </div>
              <div className="tiny-cap mt-4 text-[var(--color-sun-ink)]">
                Needs your attention
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-2)]">
                <span className="font-display text-3xl font-bold tabular-nums text-[var(--color-ink)]">
                  {pendingClaims.length}
                </span>{' '}
                new claim request
                {pendingClaims.length === 1 ? '' : 's'} awaiting your decision.
              </p>
              <Link
                to="/restaurant/claims"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-sun-ink)] hover:underline"
              >
                Review now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="rounded-[28px] border-[1.5px] border-[var(--color-mint)] bg-[var(--color-mint-soft)] p-6">
              <div className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-[var(--color-mint)] text-white">
                <ListChecks className="h-5 w-5" />
              </div>
              <div className="tiny-cap mt-4 text-[var(--color-mint-ink)]">
                All caught up
              </div>
              <p className="mt-2 text-sm text-[var(--color-ink-2)]">
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
    <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white p-6">
      <div className="tiny-cap text-[var(--color-ink-3)]">Quick actions</div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {canPost ? (
          <ActionTile
            to="/restaurant/listings/new"
            icon={Plus}
            label="New listing"
            bg="bg-[var(--color-coral-soft)]"
            fg="text-[var(--color-coral-ink)]"
            border="border-[var(--color-coral)]"
          />
        ) : null}
        <ActionTile
          to="/restaurant/claims"
          icon={ClipboardList}
          label="Claim requests"
          bg="bg-[var(--color-sky-soft)]"
          fg="text-[var(--color-sky-ink)]"
          border="border-[var(--color-sky)]"
        />
        <ActionTile
          to="/restaurant/listings"
          icon={ShoppingBag}
          label="All listings"
          bg="bg-[var(--color-mint-soft)]"
          fg="text-[var(--color-mint-ink)]"
          border="border-[var(--color-mint)]"
        />
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
  icon: typeof Plus
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
