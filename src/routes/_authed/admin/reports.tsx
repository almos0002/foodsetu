import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { AdminTable, type Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import {
  listReportsForAdminFn,
  setReportStatusFn,
  type AdminReportRow,
} from '../../../lib/admin-server'
import {
  REPORT_REASON_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_BADGE_CLASSES,
  REPORT_STATUS_LABELS,
  canAccessAdmin,
  roleToDashboard,
  type ReportStatus,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/reports')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => ({ reports: await listReportsForAdminFn() }),
  component: AdminReports,
})

type StatusFilter = 'ALL' | ReportStatus

function AdminReports() {
  const router = useRouter()
  const { reports } = Route.useLoaderData()
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered =
    filter === 'ALL' ? reports : reports.filter((r) => r.status === filter)

  const counts = REPORT_STATUSES.reduce(
    (acc, s) => {
      acc[s] = reports.filter((r) => r.status === s).length
      return acc
    },
    {} as Record<ReportStatus, number>,
  )

  const filters = [
    { value: 'ALL' as StatusFilter, label: 'All', count: reports.length },
    ...REPORT_STATUSES.map((s) => ({
      value: s as StatusFilter,
      label: REPORT_STATUS_LABELS[s],
      count: counts[s],
    })),
  ]

  async function update(row: AdminReportRow, status: ReportStatus) {
    setError(null)
    setBusyId(row.id)
    try {
      await setReportStatusFn({ data: { id: row.id, status } })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report')
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<AdminReportRow>[] = [
    {
      key: 'report',
      header: 'Report',
      render: (r) => (
        <div className="max-w-md">
          <div className="font-medium text-gray-900">
            {REPORT_REASON_LABELS[r.reason] ?? r.reason}
          </div>
          {r.description ? (
            <div className="mt-0.5 line-clamp-2 text-xs text-gray-600">
              {r.description}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'listing',
      header: 'Listing',
      render: (r) =>
        r.listingId ? (
          <div className="text-sm">
            <Link
              to="/admin/listings"
              className="inline-flex items-center gap-1 text-gray-900 hover:text-orange-600"
            >
              {r.listingTitle ?? r.listingId.slice(0, 8)}
              <ExternalLink className="h-3 w-3" />
            </Link>
            {r.listingStatus ? (
              <div className="text-xs text-gray-500">{r.listingStatus}</div>
            ) : null}
          </div>
        ) : (
          <span className="text-xs italic text-gray-400">
            No linked listing
          </span>
        ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (r) => (
        <div>
          <div className="text-gray-900">{r.reporterName ?? '—'}</div>
          <div className="text-xs text-gray-500">
            {r.reporterOrgName ?? r.reporterEmail ?? ''}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <StatusPill
          label={REPORT_STATUS_LABELS[r.status]}
          className={REPORT_STATUS_BADGE_CLASSES[r.status]}
        />
      ),
    },
    {
      key: 'created',
      header: 'Filed',
      render: (r) => (
        <span className="text-xs text-gray-500">
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.status === 'OPEN' ? (
            <button
              type="button"
              onClick={() => update(r, 'REVIEWED')}
              disabled={busyId === r.id}
              className="rounded-md border border-amber-200 bg-white px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40"
            >
              Mark reviewed
            </button>
          ) : null}
          {r.status !== 'RESOLVED' ? (
            <button
              type="button"
              onClick={() => update(r, 'RESOLVED')}
              disabled={busyId === r.id}
              className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
            >
              Resolve
            </button>
          ) : (
            <button
              type="button"
              onClick={() => update(r, 'OPEN')}
              disabled={busyId === r.id}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              title="Re-open this report"
            >
              Re-open
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AdminShell title="Reports" user={user}>
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      ) : null}
      <AdminTable
        rows={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search by listing, reporter, description…"
        searchKeys={[
          'listingTitle',
          'reporterName',
          'reporterEmail',
          'reporterOrgName',
          'description',
        ]}
        filters={filters}
        filterValue={filter}
        onFilterChange={setFilter}
        emptyLabel="No reports filed yet."
      />
    </AdminShell>
  )
}
