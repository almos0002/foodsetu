import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2, PauseCircle, RotateCcw, XCircle } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import {
  listOrganizationsForAdminFn,
  setOrganizationVerificationFn,
  type OrganizationWithOwner,
} from '../../../lib/org-server'
import {
  ROLE_LABELS,
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

const STATUS_FILTERS: ('ALL' | VerificationStatus)[] = [
  'ALL',
  ...VERIFICATION_STATUSES,
]

function AdminOrganizations() {
  const router = useRouter()
  const { organizations } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: {
      name?: string | null
      email?: string | null
      role?: string | null
    }
    organization: null
  }
  const [filter, setFilter] = useState<'ALL' | VerificationStatus>('ALL')
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

  async function update(org: OrganizationWithOwner, status: VerificationStatus) {
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

  return (
    <DashboardShell
      title="Organizations"
      roleLabel={ROLE_LABELS.ADMIN}
      user={user}
      organization={organization}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => {
          const count =
            s === 'ALL' ? organizations.length : counts[s as VerificationStatus]
          const active = filter === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                active
                  ? 'bg-orange-600 text-white ring-orange-600'
                  : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
              }`}
            >
              {s === 'ALL' ? 'All' : VERIFICATION_LABELS[s as VerificationStatus]}
              <span className={`ml-1.5 text-[10px] ${active ? 'opacity-90' : 'text-gray-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                    No organizations
                    {filter === 'ALL' ? ' yet.' : ` with status ${VERIFICATION_LABELS[filter as VerificationStatus]}.`}
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{org.name}</div>
                      {org.address || org.phone ? (
                        <div className="text-xs text-gray-500">
                          {[org.address, org.phone].filter(Boolean).join(' · ')}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                        {org.type ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{org.ownerName ?? '—'}</div>
                      <div className="text-xs text-gray-500">{org.ownerEmail ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          VERIFICATION_BADGE_CLASSES[
                            org.verificationStatus as VerificationStatus
                          ] ?? ''
                        }`}
                      >
                        {VERIFICATION_LABELS[org.verificationStatus as VerificationStatus] ??
                          org.verificationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(org.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
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
