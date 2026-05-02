import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardShell } from '../../../components/DashboardShell'
import {
  ROLE_LABELS,
  canClaimHumanFood,
  roleToDashboard,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/ngo/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canClaimHumanFood(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  component: NgoDashboard,
})

function NgoDashboard() {
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }
  return (
    <DashboardShell title="NGO dashboard" roleLabel={ROLE_LABELS.NGO} user={user}>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
        You'll see nearby human-safe surplus food here.
      </div>
    </DashboardShell>
  )
}
