import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardShell } from '../../../components/DashboardShell'
import {
  ROLE_LABELS,
  canCreateFoodListing,
  roleToDashboard,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/restaurant/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    // Admins can also access this view, but they should default to their own dashboard.
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
    if (!canCreateFoodListing(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  component: RestaurantDashboard,
})

function RestaurantDashboard() {
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }
  return (
    <DashboardShell
      title="Restaurant dashboard"
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
    >
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
        You'll be able to post surplus food listings here.
      </div>
    </DashboardShell>
  )
}
