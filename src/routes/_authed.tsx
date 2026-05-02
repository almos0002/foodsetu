import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getServerSession } from '../lib/auth-server'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const session = await getServerSession()
    if (!session?.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    return {
      user: session.user as typeof session.user & { role?: string | null },
      sessionId: session.session.id,
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return <Outlet />
}
