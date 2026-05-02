import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2, PauseCircle, RotateCcw, XCircle } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { AdminTable, type Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import { Alert } from '../../../components/ui/Alert'
import {
  listOrganizationsForAdminFn,
  setOrganizationVerificationFn,
  type OrganizationWithOwner,
} from '../../../lib/org-server'
import {
  VERIFICATION_BADGE_CLASSES,
  VERIFICATION_LABELS,
  VERIFICATION_STATUSES,
  canAccessAdmin,
  roleToDashboard,
  type VerificationStatus,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/organizations')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => ({ organizations: await listOrganizationsForAdminFn() }),
  component: AdminOrganizations,
})

type StatusFilter = 'ALL' | VerificationStatus

function AdminOrganizations() {
  const router = useRouter()
  const { organizations } = Route.useLoaderData()
  const { user } = Route.useRouteContext() as {
    user: {
      name?: string | null
      email?: string | null
      role?: string | null
    }
  }
  const [filter, setFilter] = useState<StatusFilter>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered =
    filter === 'ALL'
      ? organizations
      : organizations.filter((o) => o.verificationStatus === filter)

  const counts = VERIFICATION_STATUSES.reduce(
    (acc, s) => {
      acc[s] = organizations.filter((o) => o.verificationStatus === s).length
      return acc
    },
    {} as Record<VerificationStatus, number>,
  )

  const filters = [
    {
      value: 'ALL' as StatusFilter,
      label: 'All',
      count: organizations.length,
    },
    ...VERIFICATION_STATUSES.map((s) => ({
      value: s as StatusFilter,
      label: VERIFICATION_LABELS[s],
      count: counts[s],
    })),
  ]

  async function update(
    org: OrganizationWithOwner,
    status: VerificationStatus,
  ) {
    setError(null)
    setBusyId(org.id)
    try {
      await setOrganizationVerificationFn({
        data: { organizationId: org.id, status },
      })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<OrganizationWithOwner>[] = [
    {
      key: 'org',
      header: 'Organization',
      render: (org) => (
        <div>
          <div className="font-medium text-gray-900">{org.name}</div>
          {org.address || org.phone ? (
            <div className="text-xs text-gray-500">
              {[org.address, org.phone].filter(Boolean).join(' · ')}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (org) => (
        <StatusPill
          label={org.type ?? '—'}
          className="bg-gray-100 text-gray-700 ring-1 ring-gray-200"
        />
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (org) => (
        <div>
          <div className="text-gray-900">{org.ownerName ?? '—'}</div>
          <div className="text-xs text-gray-500">{org.ownerEmail ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (org) => (
        <StatusPill
          label={
            VERIFICATION_LABELS[
              org.verificationStatus as VerificationStatus
            ] ?? org.verificationStatus
          }
          className={
            VERIFICATION_BADGE_CLASSES[
              org.verificationStatus as VerificationStatus
            ]
          }
        />
      ),
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (org) => (
        <span className="text-xs text-gray-500">
          {new Date(org.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (org) => (
        <div className="flex justify-end gap-1.5">
          <ActionBtn
            label="Verify"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            color="emerald"
            disabled={busyId === org.id || org.verificationStatus === 'VERIFIED'}
            onClick={() => update(org, 'VERIFIED')}
          />
          <ActionBtn
            label="Reject"
            icon={<XCircle className="h-3.5 w-3.5" />}
            color="red"
            disabled={busyId === org.id || org.verificationStatus === 'REJECTED'}
            onClick={() => update(org, 'REJECTED')}
          />
          <ActionBtn
            label="Suspend"
            icon={<PauseCircle className="h-3.5 w-3.5" />}
            color="gray"
            disabled={busyId === org.id || org.verificationStatus === 'SUSPENDED'}
            onClick={() => update(org, 'SUSPENDED')}
          />
          <ActionBtn
            label="Reset"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            color="amber"
            disabled={busyId === org.id || org.verificationStatus === 'PENDING'}
            onClick={() => update(org, 'PENDING')}
          />
        </div>
      ),
    },
  ]

  return (
    <AdminShell title="Organizations" user={user}>
      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}
      <AdminTable
        rows={filtered}
        columns={columns}
        rowKey={(o) => o.id}
        searchPlaceholder="Search by name, owner, address…"
        searchKeys={['name', 'ownerName', 'ownerEmail', 'address', 'phone']}
        filters={filters}
        filterValue={filter}
        onFilterChange={setFilter}
        emptyLabel="No organizations yet."
      />
    </AdminShell>
  )
}

const COLOR_CLASSES: Record<string, string> = {
  emerald: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
  red: 'border-red-200 text-red-700 hover:bg-red-50',
  gray: 'border-gray-300 text-gray-700 hover:bg-gray-50',
  amber: 'border-amber-200 text-amber-700 hover:bg-amber-50',
}

function ActionBtn({
  label,
  icon,
  color,
  disabled,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  color: keyof typeof COLOR_CLASSES
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${COLOR_CLASSES[color]}`}
    >
      {icon}
      {label}
    </button>
  )
}
