import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardShell } from '../../../components/DashboardShell'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  ROLE_LABELS,
  canClaimAnimalFood,
  roleToDashboard,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/animal/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'ANIMAL_RESCUE' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  component: AnimalDashboard,
})

function AnimalDashboard() {
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const canClaim = canClaimAnimalFood(user, organization)
  return (
    <DashboardShell
      title="Animal rescue dashboard"
      roleLabel={ROLE_LABELS.ANIMAL_RESCUE}
      user={user}
      organization={organization}
    >
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
        {canClaim
          ? "You'll see nearby animal-safe surplus food here."
          : 'Claiming food is locked until your organization is verified.'}
      </div>
    </DashboardShell>
  )
}
