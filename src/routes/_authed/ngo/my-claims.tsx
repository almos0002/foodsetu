import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { ClipboardList, History, Inbox, Utensils } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { MyClaimCard } from '../../../components/food/MyClaimCard'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Tabs } from '../../../components/ui/Tabs'
import { listMyClaimsFn } from '../../../lib/claim-server'
import {
  ACTIVE_CLAIM_STATUSES,
  ROLE_LABELS,
  canManageNgoClaims,
  roleToDashboard,
} from '../../../lib/permissions'

type Tab = 'active' | 'history'

export const Route = createFileRoute('/_authed/ngo/my-claims')({
  head: () => ({ meta: [{ title: 'My claims · NGO | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  loader: async () => {
    const claims = await listMyClaimsFn().catch(() => [])
    return { claims }
  },
  component: MyClaimsPage,
})

const ACTIVE_SET = new Set<string>(ACTIVE_CLAIM_STATUSES)

function MyClaimsPage() {
  const { claims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext()
  const canClaim = canManageNgoClaims(user, organization)
  const [tab, setTab] = useState<Tab>('active')

  const active = claims.filter((c) => ACTIVE_SET.has(c.status))
  const history = claims.filter((c) => !ACTIVE_SET.has(c.status))
  const rows = tab === 'active' ? active : history

  return (
    <DashboardShell
      title="My claims"
      roleLabel={ROLE_LABELS.NGO}
      user={user}
      organization={organization}
    >
      <PageHeader
        title="My claims"
        description="Track pickup status and report issues with your claims."
        back={{ to: '/ngo/dashboard', label: 'Back to dashboard' }}
        actions={
          canClaim ? (
            <Link to="/ngo/nearby-food">
              <Button leftIcon={<Utensils className="h-4 w-4" />}>
                Browse nearby food
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          tabs={[
            {
              value: 'active',
              label: 'Active',
              icon: <ClipboardList className="h-4 w-4" />,
              count: active.length,
            },
            {
              value: 'history',
              label: 'History',
              icon: <History className="h-4 w-4" />,
              count: history.length,
            },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={tab === 'active' ? 'No active claims' : 'No past claims yet'}
          description={
            tab === 'active'
              ? canClaim
                ? 'Browse nearby food to make your first claim.'
                : 'Verification pending — claims will appear here once approved.'
              : 'Completed and rejected claims will be archived here.'
          }
          action={
            tab === 'active' && canClaim ? (
              <Link to="/ngo/nearby-food">
                <Button leftIcon={<Utensils className="h-4 w-4" />}>
                  Browse nearby food
                </Button>
              </Link>
            ) : undefined
          }
        />
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
