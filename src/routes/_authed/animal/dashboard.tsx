import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardShell } from '../../../components/DashboardShell'
import {
  ROLE_LABELS,
  canClaimAnimalFood,
  roleToDashboard,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/animal/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canClaimAnimalFood(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  component: AnimalDashboard,
})

function AnimalDashboard() {
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }
  return (
    <DashboardShell
      title="Animal rescue dashboard"
      roleLabel={ROLE_LABELS.ANIMAL_RESCUE}
      user={user}
    >
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
        You'll see nearby animal-safe surplus food here.
      </div>
    </DashboardShell>
  )
}
