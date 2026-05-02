import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardShell } from '../../../components/DashboardShell'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  ROLE_LABELS,
  canClaimHumanFood,
  roleToDashboard,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/ngo/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  component: NgoDashboard,
})

function NgoDashboard() {
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const canClaim = canClaimHumanFood(user, organization)
  return (
    <DashboardShell
      title="NGO dashboard"
      roleLabel={ROLE_LABELS.NGO}
      user={user}
      organization={organization}
    >
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
        {canClaim
          ? "You'll see nearby human-safe surplus food here."
          : 'Claiming food is locked until your organization is verified.'}
      </div>
    </DashboardShell>
  )
}
