import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ChevronRight,
  History,
  ListChecks,
  Plus,
  ShoppingBag,
} from 'lucide-react'
import { DashboardShell } from '../../../../components/DashboardShell'
import { Button } from '../../../../components/ui/Button'
import { ListingStatusBadge } from '../../../../components/ui/ClaimStatusBadge'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { PageHeader } from '../../../../components/ui/PageHeader'
import { Tabs } from '../../../../components/ui/Tabs'
import { listMyListingsFn } from '../../../../lib/listing-server'
import type { ListingRow } from '../../../../lib/listing-server'
import {
  ROLE_LABELS,
  isOrgVerified,
  roleToDashboard,
} from '../../../../lib/permissions'
import { dateTime } from '../../../../lib/time'

type Tab = 'active' | 'history'

export const Route = createFileRoute('/_authed/restaurant/listings/')({
  head: () => ({ meta: [{ title: 'My listings · Restaurant | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) })
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
  const { user, organization } = Route.useRouteContext()
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
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                New listing
              </Button>
            </Link>
          ) : (
            <span className="text-xs text-[var(--color-ink-3)]">
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
        <div className="overflow-hidden rounded-[24px] border border-[var(--color-line)] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b-[1.5px] border-[var(--color-line)] bg-[var(--color-cream)] text-left">
                <tr>
                  <Th>Title</Th>
                  <Th>Quantity</Th>
                  <Th>Pickup window</Th>
                  <Th>Status</Th>
                  <Th align="right">Open</Th>
                </tr>
              </thead>
              <tbody className="divide-y-[1.5px] divide-[var(--color-line)]">
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

function Th({
  children,
  align,
}: {
  children: React.ReactNode
  align?: 'right'
}) {
  return (
    <th
      className={`tiny-cap px-4 py-3 text-[var(--color-ink-3)] ${align === 'right' ? 'text-right' : ''}`}
    >
      {children}
    </th>
  )
}

function ListingRowEl({ row }: { row: ListingRow }) {
  const status = row.status
  return (
    <tr className="transition-colors hover:bg-[var(--color-cream)]">
      <td className="px-4 py-3">
        <div className="font-bold text-[var(--color-ink)]">{row.title}</div>
        <div className="text-xs text-[var(--color-ink-3)]">{row.foodType}</div>
      </td>
      <td className="px-4 py-3 text-[var(--color-ink-2)]">
        {row.quantity} {row.quantityUnit}
      </td>
      <td className="px-4 py-3 text-xs text-[var(--color-ink-2)]">
        <div>{dateTime(row.pickupStartTime)}</div>
        <div className="text-[var(--color-ink-3)]">
          → {dateTime(row.pickupEndTime)}
        </div>
      </td>
      <td className="px-4 py-3">
        <ListingStatusBadge status={status} size="sm" />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          to="/restaurant/listings/$id"
          params={{ id: row.id }}
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-coral)] hover:text-[var(--color-coral-2)]"
        >
          Open
          <ChevronRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  )
}
