import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getServerSession } from '../lib/auth-server'
import { getMyOrganizationFn, type OrganizationRow } from '../lib/org-server'
import { requiresOrganization, roleToDashboard } from '../lib/permissions'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const session = await getServerSession()
    if (!session?.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    const user = session.user as typeof session.user & {
      role?: string | null
    }

    let organization: OrganizationRow | null = null
    const isOnboardingRoute = location.pathname.startsWith('/onboarding')

    if (requiresOrganization(user)) {
      organization = await getMyOrganizationFn()
      if (!organization && !isOnboardingRoute) {
        throw redirect({ to: '/onboarding/organization' })
      }
      if (organization && isOnboardingRoute) {
        throw redirect({ to: roleToDashboard(user.role) as string })
      }
    } else if (isOnboardingRoute) {
      // Admins don't onboard.
      throw redirect({ to: roleToDashboard(user.role) as string })
    }

    return {
      user,
      organization,
      sessionId: session.session.id,
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return <Outlet />
}
