import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Ban } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { AdminTable, type Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import {
  adminCancelListingFn,
  listListingsForAdminFn,
  type AdminListingRow,
} from '../../../lib/admin-server'
import {
  FOOD_CATEGORY_LABELS,
  LISTING_STATUSES,
  LISTING_STATUS_BADGE_CLASSES,
  LISTING_STATUS_LABELS,
  canAccessAdmin,
  roleToDashboard,
  type FoodCategory,
  type ListingStatus,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/listings')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => ({ listings: await listListingsForAdminFn() }),
  component: AdminListings,
})

const NON_CANCELABLE = new Set<ListingStatus>([
  'PICKED_UP',
  'EXPIRED',
  'CANCELLED',
])

type StatusFilter = 'ALL' | ListingStatus

function AdminListings() {
  const router = useRouter()
  const { listings } = Route.useLoaderData()
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered =
    filter === 'ALL'
      ? listings
      : listings.filter((l) => l.status === filter)

  const counts = LISTING_STATUSES.reduce(
    (acc, s) => {
      acc[s] = listings.filter((l) => l.status === s).length
      return acc
    },
    {} as Record<ListingStatus, number>,
  )

  const filters = [
    { value: 'ALL' as StatusFilter, label: 'All', count: listings.length },
    ...LISTING_STATUSES.map((s) => ({
      value: s as StatusFilter,
      label: LISTING_STATUS_LABELS[s],
      count: counts[s],
    })),
  ]

  async function handleCancel(row: AdminListingRow) {
    if (
      !confirm(
        `Cancel "${row.title}"? Any active claim on this listing will also be cancelled.`,
      )
    ) {
      return
    }
    setError(null)
    setBusyId(row.id)
    try {
      await adminCancelListingFn({ data: { id: row.id } })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel listing')
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<AdminListingRow>[] = [
    {
      key: 'listing',
      header: 'Listing',
      render: (l) => (
        <div>
          <div className="font-medium text-gray-900">{l.title}</div>
          <div className="text-xs text-gray-500">
            {Number(l.quantity)} {l.quantityUnit} ·{' '}
            {FOOD_CATEGORY_LABELS[l.foodCategory as FoodCategory] ??
              l.foodCategory}{' '}
            · {l.foodType}
          </div>
        </div>
      ),
    },
    {
      key: 'restaurant',
      header: 'Restaurant',
      render: (l) => (
        <div>
          <div className="text-gray-900">{l.restaurantName ?? '—'}</div>
          {l.cityName ? (
            <div className="text-xs text-gray-500">{l.cityName}</div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) => (
        <StatusPill
          label={
            LISTING_STATUS_LABELS[l.status as ListingStatus] ?? l.status
          }
          className={LISTING_STATUS_BADGE_CLASSES[l.status as ListingStatus]}
        />
      ),
    },
    {
      key: 'pickup',
      header: 'Pickup window',
      render: (l) => (
        <div className="text-xs text-gray-600">
          {new Date(l.pickupStartTime).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}{' '}
          –{' '}
          {new Date(l.pickupEndTime).toLocaleString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Posted',
      render: (l) => (
        <span className="text-xs text-gray-500">
          {new Date(l.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (l) => {
        const blocked = NON_CANCELABLE.has(l.status as ListingStatus)
        return (
          <button
            type="button"
            onClick={() => handleCancel(l)}
            disabled={blocked || busyId === l.id}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
            title={
              blocked
                ? `Cannot cancel a listing in ${l.status}`
                : 'Cancel as unsafe / inappropriate'
            }
          >
            <Ban className="h-3.5 w-3.5" />
            {busyId === l.id ? 'Cancelling…' : 'Cancel'}
          </button>
        )
      },
    },
  ]

  return (
    <AdminShell title="Food listings" user={user}>
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      ) : null}
      <AdminTable
        rows={filtered}
        columns={columns}
        rowKey={(l) => l.id}
        searchPlaceholder="Search by title, restaurant, city…"
        searchKeys={['title', 'restaurantName', 'cityName']}
        filters={filters}
        filterValue={filter}
        onFilterChange={setFilter}
        emptyLabel="No listings yet."
      />
    </AdminShell>
  )
}
