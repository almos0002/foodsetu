import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardShell } from '../../../components/DashboardShell'
import { ROLE_LABELS, canAccessAdmin, roleToDashboard } from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/dashboard')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  component: AdminDashboard,
})

function AdminDashboard() {
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }
  return (
    <DashboardShell title="Admin dashboard" roleLabel={ROLE_LABELS.ADMIN} user={user}>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-sm text-gray-600">
        Admin features coming soon.
      </div>
    </DashboardShell>
  )
}
