import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
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
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: null
  }
  return (
    <DashboardShell
      title="Admin dashboard"
      roleLabel={ROLE_LABELS.ADMIN}
      user={user}
      organization={organization}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/organizations"
          className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow"
        >
          <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-700">
              Organizations
            </div>
            <div className="mt-0.5 text-xs text-gray-600">
              Review, verify, reject, or suspend partner organizations.
            </div>
          </div>
        </Link>
      </div>
    </DashboardShell>
  )
}
