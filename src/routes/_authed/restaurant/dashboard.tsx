import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import {
  ChevronRight,
  History,
  Inbox,
  ListChecks,
  Plus,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
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
  const recent = active.slice(0, 4)
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
        title="Restaurant dashboard"
        description={
          organization?.name
            ? `Welcome back, ${organization.name}`
            : 'Surplus food at a glance'
        }
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
        />
        <DashboardStatsCard
          label="Past listings"
          value={history.length}
          icon={History}
          tone="default"
          to="/restaurant/listings"
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
              : undefined
          }
        />
        <DashboardStatsCard
          label="Total in pipeline"
          value={active.length + activeClaims.length}
          icon={ListChecks}
          tone="blue"
          hint="Listings + open claims"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Recent active listings</CardTitle>
            <Link
              to="/restaurant/listings"
              className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              See all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
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
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {row.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.quantity} {row.quantityUnit} · pickup{' '}
                        {new Date(row.pickupStartTime).toLocaleString(
                          undefined,
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          },
                        )}
                      </div>
                    </div>
                    <ListingStatusBadge status={status} size="sm" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {pendingClaims.length > 0 ? (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Awaiting your decision</CardTitle>
              <Link
                to="/restaurant/claims"
                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                Review all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600">
              You have <span className="font-semibold text-gray-900">{pendingClaims.length}</span>{' '}
              new claim request{pendingClaims.length === 1 ? '' : 's'}.
            </p>
          </CardBody>
        </Card>
      ) : null}
    </DashboardShell>
  )
}
