import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { AdminTable, type Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import {
  listClaimsForAdminFn,
  type AdminClaimRow,
} from '../../../lib/admin-server'
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_BADGE_CLASSES,
  CLAIM_STATUS_LABELS,
  canAccessAdmin,
  roleToDashboard,
  type ClaimStatus,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/claims')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => ({ claims: await listClaimsForAdminFn() }),
  component: AdminClaims,
})

type StatusFilter = 'ALL' | ClaimStatus

function AdminClaims() {
  const { claims } = Route.useLoaderData()
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }
  const [filter, setFilter] = useState<StatusFilter>('ALL')

  const filtered =
    filter === 'ALL'
      ? claims
      : claims.filter((c) => c.status === filter)

  const counts = CLAIM_STATUSES.reduce(
    (acc, s) => {
      acc[s] = claims.filter((c) => c.status === s).length
      return acc
    },
    {} as Record<ClaimStatus, number>,
  )

  const filters = [
    { value: 'ALL' as StatusFilter, label: 'All', count: claims.length },
    ...CLAIM_STATUSES.map((s) => ({
      value: s as StatusFilter,
      label: CLAIM_STATUS_LABELS[s],
      count: counts[s],
    })),
  ]

  const columns: Column<AdminClaimRow>[] = [
    {
      key: 'listing',
      header: 'Listing',
      render: (c) => (
        <div>
          <div className="font-medium text-gray-900">
            {c.listingTitle ?? '—'}
          </div>
          <div className="text-xs text-gray-500">
            from {c.restaurantName ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'claimant',
      header: 'Claimant',
      render: (c) => (
        <div>
          <div className="text-gray-900">{c.claimantOrgName ?? '—'}</div>
          <div className="text-xs text-gray-500">{c.claimantOrgType}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <StatusPill
          label={CLAIM_STATUS_LABELS[c.status as ClaimStatus] ?? c.status}
          className={CLAIM_STATUS_BADGE_CLASSES[c.status as ClaimStatus]}
        />
      ),
    },
    {
      key: 'verified',
      header: 'Verified at',
      render: (c) =>
        c.otpVerifiedAt ? (
          <span className="text-xs text-emerald-700">
            {new Date(c.otpVerifiedAt).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (c) => (
        <span className="text-xs text-gray-500">
          {new Date(c.createdAt).toLocaleString()}
        </span>
      ),
    },
  ]

  return (
    <AdminShell title="Claims" user={user}>
      <AdminTable
        rows={filtered}
        columns={columns}
        rowKey={(c) => c.id}
        searchPlaceholder="Search by listing, restaurant, claimant…"
        searchKeys={['listingTitle', 'restaurantName', 'claimantOrgName']}
        filters={filters}
        filterValue={filter}
        onFilterChange={setFilter}
        emptyLabel="No claims yet."
      />
    </AdminShell>
  )
}
