import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { AdminTable } from '../../../components/admin/AdminTable'
import type { Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import { listUsersForAdminFn } from '../../../lib/admin-server'
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

type RoleFilter = 'ALL' | Role

function AdminUsers() {
  const { users } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')

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
        return (
          <StatusPill
            label={r ? ROLE_LABELS[r] : '—'}
            tone={r ? ROLE_TONE[r] : 'gray'}
          />
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
    </AdminShell>
  )
}
