import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { History, Inbox, ListChecks, Plus } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { listClaimRequestsForRestaurantFn } from '../../../lib/claim-server'
import { listMyListingsFn } from '../../../lib/listing-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  LISTING_STATUS_BADGE_CLASSES,
  LISTING_STATUS_LABELS,
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
    // Active+history listings power the small dashboard widget. Restaurants
    // who can't post (unverified / wrong org type) get [] back. Active
    // claim requests power the inbox-style "claim requests" stat.
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
  const recent = active.slice(0, 3)
  const pendingClaims = activeClaims.filter((c) => c.status === 'PENDING')

  return (
    <DashboardShell
      title="Restaurant dashboard"
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active listings" value={active.length} />
        <StatCard label="Past listings" value={history.length} />
        <Link
          to="/restaurant/claims"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow"
        >
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
            <span>Pending claims</span>
            <Inbox className="h-4 w-4 text-gray-400 group-hover:text-orange-600" />
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {pendingClaims.length}
          </div>
          {activeClaims.length > pendingClaims.length ? (
            <div className="mt-1 text-[11px] text-gray-500">
              {activeClaims.length - pendingClaims.length} accepted in progress
            </div>
          ) : null}
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Quick actions
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {canPost ? (
              <Link
                to="/restaurant/listings/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                <Plus className="h-4 w-4" />
                New listing
              </Link>
            ) : null}
            <Link
              to="/restaurant/listings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ListChecks className="h-4 w-4" />
              Listings
            </Link>
            <Link
              to="/restaurant/claims"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Inbox className="h-4 w-4" />
              Claims
              {pendingClaims.length > 0 ? (
                <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                  {pendingClaims.length}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent active listings</h2>
          <Link
            to="/restaurant/listings"
            className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            <History className="h-3.5 w-3.5" />
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
            {canPost
              ? 'No active listings yet — post your first one!'
              : verified
                ? 'No active listings yet.'
                : 'Posting listings is locked until your organization is verified.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((row) => {
              const status = row.status as ListingStatus
              return (
                <li key={row.id}>
                  <Link
                    to="/restaurant/listings/$id"
                    params={{ id: row.id }}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {row.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.quantity} {row.quantityUnit} · pickup{' '}
                        {new Date(row.pickupStartTime).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${LISTING_STATUS_BADGE_CLASSES[status] ?? ''}`}
                    >
                      {LISTING_STATUS_LABELS[status] ?? status}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </DashboardShell>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}
