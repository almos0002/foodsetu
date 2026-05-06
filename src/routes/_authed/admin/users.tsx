import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { AdminTable } from '../../../components/admin/AdminTable'
import type { Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../components/ui/Toast'
import {
  deleteUserFn,
  listUsersForAdminFn,
  setUserRoleFn,
} from '../../../lib/admin-server'
import type { AdminUserRow } from '../../../lib/admin-server'
import {
  ROLE_LABELS,
  ROLES,
  VERIFICATION_BADGE_TONES,
  VERIFICATION_LABELS,
  canAccessAdmin,
  roleToDashboard,
} from '../../../lib/permissions'
import type { Role, VerificationStatus } from '../../../lib/permissions'
import type { BadgeTone } from '../../../components/ui/StatusBadge'

export const Route = createFileRoute('/_authed/admin/users')({
  head: () => ({ meta: [{ title: 'Users · Admin | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  loader: async () => ({ users: await listUsersForAdminFn() }),
  component: AdminUsers,
})

const ROLE_TONE: Record<Role, BadgeTone> = {
  ADMIN: 'purple',
  RESTAURANT: 'orange',
  NGO: 'blue',
  ANIMAL_RESCUE: 'teal',
}

const ASSIGNABLE_ROLES: Role[] = ['RESTAURANT', 'NGO', 'ANIMAL_RESCUE']

type RoleFilter = 'ALL' | Role

function AdminUsers() {
  const router = useRouter()
  const { users } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [confirmRow, setConfirmRow] = useState<AdminUserRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const toast = useToast()

  const filtered =
    roleFilter === 'ALL' ? users : users.filter((u) => u.role === roleFilter)

  const counts = ROLES.reduce(
    (acc, r) => {
      acc[r] = users.filter((u) => u.role === r).length
      return acc
    },
    {} as Record<Role, number>,
  )

  const filters = [
    { value: 'ALL' as RoleFilter, label: 'All', count: users.length },
    ...ROLES.map((r) => ({
      value: r,
      label: ROLE_LABELS[r],
      count: counts[r],
    })),
  ]

  async function handleDelete(row: AdminUserRow) {
    setBusyId(row.id)
    try {
      await deleteUserFn({ data: { id: row.id } })
      toast.success(`Deleted ${row.email ?? row.name ?? 'user'}`)
      setConfirmRow(null)
      router.invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRoleChange(row: AdminUserRow, role: Role) {
    if (row.role === role) return
    setBusyId(row.id)
    try {
      await setUserRoleFn({ data: { id: row.id, role } })
      toast.success(
        `Role updated for ${row.email ?? row.name ?? 'user'} → ${ROLE_LABELS[role]}`,
      )
      router.invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<AdminUserRow>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div>
          <div className="font-medium text-gray-900">{u.name ?? '—'}</div>
          <div className="text-xs text-gray-500">{u.email ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => {
        const r = u.role as Role | null
        const isAdmin = r === 'ADMIN'
        const isSelf = u.id === user.id
        if (isAdmin || isSelf) {
          return (
            <StatusPill
              label={r ? ROLE_LABELS[r] : '—'}
              tone={r ? ROLE_TONE[r] : 'gray'}
            />
          )
        }
        return (
          <select
            className="squircle border border-[var(--color-line)] bg-[var(--color-canvas)] px-2 py-1 text-xs text-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none disabled:opacity-50"
            value={r ?? ''}
            disabled={busyId === u.id}
            onChange={(e) => handleRoleChange(u, e.target.value as Role)}
          >
            {ASSIGNABLE_ROLES.map((opt) => (
              <option key={opt} value={opt}>
                {ROLE_LABELS[opt]}
              </option>
            ))}
          </select>
        )
      },
    },
    {
      key: 'org',
      header: 'Organization',
      render: (u) =>
        u.orgName ? (
          <div>
            <div className="text-gray-900">{u.orgName}</div>
            <div className="text-xs text-gray-500">{u.orgType}</div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">— none</span>
        ),
    },
    {
      key: 'orgStatus',
      header: 'Org status',
      render: (u) =>
        u.orgVerificationStatus ? (
          <StatusPill
            label={
              VERIFICATION_LABELS[
                u.orgVerificationStatus as VerificationStatus
              ] ?? u.orgVerificationStatus
            }
            tone={
              VERIFICATION_BADGE_TONES[
                u.orgVerificationStatus as VerificationStatus
              ]
            }
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'verified',
      header: 'Email',
      render: (u) =>
        u.emailVerified ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <XCircle className="h-3.5 w-3.5" /> Unverified
          </span>
        ),
    },
    {
      key: 'created',
      header: 'Joined',
      render: (u) => (
        <span className="text-xs text-gray-500">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (u) => {
        const isAdmin = u.role === 'ADMIN'
        const isSelf = u.id === user.id
        if (isAdmin || isSelf) {
          return <span className="text-xs text-gray-400">—</span>
        }
        return (
          <button
            type="button"
            onClick={() => setConfirmRow(u)}
            disabled={busyId === u.id}
            className="inline-flex items-center gap-1 squircle border border-[var(--color-line)] px-2 py-1 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] disabled:opacity-50"
            aria-label={`Delete ${u.email ?? u.name ?? 'user'}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        )
      },
    },
  ]

  return (
    <AdminShell title="Users" user={user}>
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <ShieldCheck className="h-4 w-4 text-orange-600" />
        Roles are server-managed; admins are not self-assigned.
      </div>
      <AdminTable
        rows={filtered}
        columns={columns}
        rowKey={(u) => u.id}
        searchPlaceholder="Search by name, email, organization…"
        searchKeys={['name', 'email', 'orgName']}
        filters={filters}
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        emptyLabel="No users yet."
      />
      <ConfirmDialog
        open={confirmRow != null}
        title="Delete this user?"
        description={
          confirmRow ? (
            <>
              Permanently delete{' '}
              <strong>{confirmRow.name ?? confirmRow.email ?? 'this user'}</strong>{' '}
              ({confirmRow.email}). Their sessions, accounts and organization
              memberships will be removed. Listings, claims and reports they
              created will remain. This cannot be undone.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Delete user"
        cancelLabel="Keep user"
        destructive
        busy={confirmRow != null && busyId === confirmRow.id}
        onConfirm={() => confirmRow && handleDelete(confirmRow)}
        onCancel={() => setConfirmRow(null)}
      />
    </AdminShell>
  )
}
