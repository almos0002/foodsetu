import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronRight, History, ListChecks, Plus } from 'lucide-react'
import { DashboardShell } from '../../../../components/DashboardShell'
import { listMyListingsFn, type ListingRow } from '../../../../lib/listing-server'
import type { OrganizationRow } from '../../../../lib/org-server'
import {
  LISTING_STATUS_BADGE_CLASSES,
  LISTING_STATUS_LABELS,
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
          <TabBtn
            active={tab === 'active'}
            onClick={() => setTab('active')}
            icon={<ListChecks className="h-4 w-4" />}
            label="Active"
            count={active.length}
          />
          <TabBtn
            active={tab === 'history'}
            onClick={() => setTab('history')}
            icon={<History className="h-4 w-4" />}
            label="History"
            count={history.length}
          />
        </div>

        {verified ? (
          <Link
            to="/restaurant/listings/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            New listing
          </Link>
        ) : (
          <span className="text-xs text-gray-500">
            Verify your organization to start posting listings.
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">
                    {tab === 'active'
                      ? verified
                        ? 'No active listings yet — post your first one!'
                        : 'No active listings. Verification pending.'
                      : 'No past listings yet.'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => <ListingRowEl key={row.id} row={row} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
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
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${LISTING_STATUS_BADGE_CLASSES[status] ?? ''}`}
        >
          {LISTING_STATUS_LABELS[status] ?? status}
        </span>
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

function TabBtn({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-orange-600 text-white'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-1.5 text-[10px] ${
          active ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {count}
      </span>
    </button>
  )
}
