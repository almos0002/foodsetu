import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronRight, History, ListChecks, Plus, ShoppingBag } from 'lucide-react'
import { DashboardShell } from '../../../../components/DashboardShell'
import { Button } from '../../../../components/ui/Button'
import { ListingStatusBadge } from '../../../../components/ui/ClaimStatusBadge'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { PageHeader } from '../../../../components/ui/PageHeader'
import { Tabs } from '../../../../components/ui/Tabs'
import { listMyListingsFn, type ListingRow } from '../../../../lib/listing-server'
import type { OrganizationRow } from '../../../../lib/org-server'
import {
  ROLE_LABELS,
  isOrgVerified,
  roleToDashboard,
  type ListingStatus,
} from '../../../../lib/permissions'

type Tab = 'active' | 'history'

export const Route = createFileRoute('/_authed/restaurant/listings/')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => {
    const [active, history] = await Promise.all([
      listMyListingsFn({ data: { scope: 'active' } }),
      listMyListingsFn({ data: { scope: 'history' } }),
    ])
    return { active, history }
  },
  component: RestaurantListings,
})

function RestaurantListings() {
  const { active, history } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const verified = isOrgVerified(organization)
  const [tab, setTab] = useState<Tab>('active')
  const rows = tab === 'active' ? active : history

  return (
    <DashboardShell
      title="Food listings"
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <PageHeader
        title="Food listings"
        description="Manage the surplus you're offering and review past posts."
        back={{ to: '/restaurant/dashboard', label: 'Back to dashboard' }}
        actions={
          verified ? (
            <Link to="/restaurant/listings/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>New listing</Button>
            </Link>
          ) : (
            <span className="text-xs text-gray-500">
              Verify your organization to start posting listings.
            </span>
          )
        }
      />

      <div className="mb-4">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: 'active',
              label: 'Active',
              icon: <ListChecks className="h-4 w-4" />,
              count: active.length,
            },
            {
              value: 'history',
              label: 'History',
              icon: <History className="h-4 w-4" />,
              count: history.length,
            },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={
            tab === 'active'
              ? verified
                ? 'No active listings yet'
                : 'No active listings'
              : 'No past listings yet'
          }
          description={
            tab === 'active'
              ? verified
                ? 'Post your first surplus listing to start helping nearby orgs.'
                : 'Verification pending — listings will appear here once you can post.'
              : 'Completed and cancelled listings will be archived here.'
          }
          action={
            tab === 'active' && verified ? (
              <Link to="/restaurant/listings/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  Post a listing
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Pickup window</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <ListingRowEl key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

function ListingRowEl({ row }: { row: ListingRow }) {
  const status = row.status as ListingStatus
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{row.title}</div>
        <div className="text-xs text-gray-500">{row.foodType}</div>
      </td>
      <td className="px-4 py-3 text-gray-700">
        {row.quantity} {row.quantityUnit}
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">
        <div>{new Date(row.pickupStartTime).toLocaleString()}</div>
        <div className="text-gray-400">
          → {new Date(row.pickupEndTime).toLocaleString()}
        </div>
      </td>
      <td className="px-4 py-3">
        <ListingStatusBadge status={status} size="sm" />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          to="/restaurant/listings/$id"
          params={{ id: row.id }}
          className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Open
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  )
}
