import type { ReactNode } from 'react'
import { DashboardShell } from '../DashboardShell'
import { ROLE_LABELS } from '../../lib/permissions'

type Props = {
  title: string
  user: { name?: string | null; email?: string | null; role?: string | null }
  children: ReactNode
}

export function AdminShell({ title, user, children }: Props) {
  return (
    <DashboardShell
      title={title}
      roleLabel={ROLE_LABELS.ADMIN}
      user={{ ...user, role: user.role ?? 'ADMIN' }}
      organization={null}
    >
      {children}
    </DashboardShell>
  )
}
