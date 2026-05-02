import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, History, ListChecks, Utensils } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { MyClaimCard } from '../../../components/food/MyClaimCard'
import { TabBtn } from '../../../components/food/ClaimDashboardWidgets'
import { listMyAnimalClaimsFn } from '../../../lib/claim-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  ACTIVE_CLAIM_STATUSES,
  ROLE_LABELS,
  canManageAnimalClaims,
  roleToDashboard,
} from '../../../lib/permissions'

type Tab = 'active' | 'history'

export const Route = createFileRoute('/_authed/animal/my-claims')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'ANIMAL_RESCUE' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => {
    const claims = await listMyAnimalClaimsFn().catch(() => [])
    return { claims }
  },
  component: MyAnimalClaimsPage,
})

const ACTIVE_SET = new Set<string>(ACTIVE_CLAIM_STATUSES)

function MyAnimalClaimsPage() {
  const { claims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const canClaim = canManageAnimalClaims(user, organization)
  const [tab, setTab] = useState<Tab>('active')

  const active = claims.filter((c) => ACTIVE_SET.has(c.status))
  const history = claims.filter((c) => !ACTIVE_SET.has(c.status))
  const rows = tab === 'active' ? active : history

  return (
    <DashboardShell
      title="My claims"
      roleLabel={ROLE_LABELS.ANIMAL_RESCUE}
      user={user}
      organization={organization}
    >
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/animal/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        {canClaim ? (
          <Link
            to="/animal/nearby-food"
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            <Utensils className="h-4 w-4" />
            Browse nearby food
          </Link>
        ) : null}
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
        <TabBtn
          active={tab === 'active'}
          onClick={() => setTab('active')}
          icon={<ListChecks className="h-4 w-4" />}
          label="Active"
          count={active.length}
        />
        <TabBtn
          active={tab === 'history'}
          onClick={() => setTab('history')}
          icon={<History className="h-4 w-4" />}
          label="History"
          count={history.length}
        />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
          {tab === 'active'
            ? canClaim
              ? 'No active claims yet — browse nearby food to make your first claim.'
              : 'No active claims. Verification pending.'
            : 'No past claims yet.'}
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((claim) => (
            <MyClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
