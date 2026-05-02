import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Ban } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { AdminTable } from '../../../components/admin/AdminTable'
import type { Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import { Alert } from '../../../components/ui/Alert'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import {
  adminCancelClaimFn,
  listClaimsForAdminFn,
} from '../../../lib/admin-server'
import type { AdminClaimRow } from '../../../lib/admin-server'
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_BADGE_TONES,
  CLAIM_STATUS_LABELS,
  canAccessAdmin,
  roleToDashboard,
} from '../../../lib/permissions'
import type { ClaimStatus } from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/claims')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  loader: async () => ({ claims: await listClaimsForAdminFn() }),
  component: AdminClaims,
})

const ADMIN_CANCELABLE_CLAIM_STATUSES = new Set<ClaimStatus>([
  'PENDING',
  'ACCEPTED',
])

type StatusFilter = 'ALL' | ClaimStatus

function AdminClaims() {
  const router = useRouter()
  const { claims } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<AdminClaimRow | null>(null)

  const filtered =
    filter === 'ALL' ? claims : claims.filter((c) => c.status === filter)

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
      value: s,
      label: CLAIM_STATUS_LABELS[s],
      count: counts[s],
    })),
  ]

  async function handleCancel(row: AdminClaimRow) {
    setError(null)
    setBusyId(row.id)
    try {
      await adminCancelClaimFn({ data: { id: row.id } })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel claim')
    } finally {
      setBusyId(null)
      setConfirmRow(null)
    }
  }

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
          tone={CLAIM_STATUS_BADGE_TONES[c.status as ClaimStatus]}
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
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => {
        const cancellable = ADMIN_CANCELABLE_CLAIM_STATUSES.has(
          c.status as ClaimStatus,
        )
        return (
          <button
            type="button"
            onClick={() => setConfirmRow(c)}
            disabled={!cancellable || busyId === c.id}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
            title={
              cancellable
                ? 'Cancel as fraudulent / abusive'
                : `Cannot cancel a claim in ${c.status}`
            }
          >
            <Ban className="h-3.5 w-3.5" />
            {busyId === c.id ? 'Cancelling…' : 'Cancel'}
          </button>
        )
      },
    },
  ]

  return (
    <AdminShell title="Claims" user={user}>
      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}
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
      <ConfirmDialog
        open={confirmRow != null}
        title="Cancel this claim?"
        description={
          confirmRow
            ? `Cancel the claim on "${confirmRow.listingTitle ?? '—'}" by ${confirmRow.claimantOrgName ?? 'this org'}? The listing will be returned to AVAILABLE if it was on hold.`
            : ''
        }
        confirmLabel="Cancel claim"
        cancelLabel="Keep active"
        destructive
        busy={confirmRow != null && busyId === confirmRow.id}
        onConfirm={() => confirmRow && handleCancel(confirmRow)}
        onCancel={() => setConfirmRow(null)}
      />
    </AdminShell>
  )
}
