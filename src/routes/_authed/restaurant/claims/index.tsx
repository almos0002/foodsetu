import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { ClipboardList, History, Inbox, ListChecks } from 'lucide-react'
import { DashboardShell } from '../../../../components/DashboardShell'
import { RestaurantClaimCard } from '../../../../components/food/RestaurantClaimCard'
import { Alert } from '../../../../components/ui/Alert'
import { Button } from '../../../../components/ui/Button'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { PageHeader } from '../../../../components/ui/PageHeader'
import { Tabs } from '../../../../components/ui/Tabs'
import {
  acceptClaimFn,
  listClaimRequestsForRestaurantFn,
  rejectClaimFn,
} from '../../../../lib/claim-server'
import {
  ACTIVE_CLAIM_STATUSES,
  ROLE_LABELS,
  isOrgVerified,
  roleToDashboard,
} from '../../../../lib/permissions'

type Tab = 'active' | 'history'

export const Route = createFileRoute('/_authed/restaurant/claims/')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  loader: async () => {
    // Fetch all so the active/history tab counts are accurate without a
    // second round-trip when the user toggles tabs.
    const claims = await listClaimRequestsForRestaurantFn({
      data: { scope: 'all' },
    }).catch(() => [])
    return { claims }
  },
  component: RestaurantClaimsPage,
})

const ACTIVE_SET = new Set<string>(ACTIVE_CLAIM_STATUSES)

function RestaurantClaimsPage() {
  const router = useRouter()
  const { claims } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext()

  const verified = isOrgVerified(organization)
  const isRestaurantOrg = !!organization && organization.type === 'RESTAURANT'
  const canManage = user.role === 'ADMIN' || (isRestaurantOrg && verified)

  const [tab, setTab] = useState<Tab>('active')
  const [busy, setBusy] = useState<{
    id: string
    kind: 'accept' | 'reject'
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const active = claims.filter((c) => ACTIVE_SET.has(c.status))
  const history = claims.filter((c) => !ACTIVE_SET.has(c.status))
  const rows = tab === 'active' ? active : history

  async function handle(action: 'accept' | 'reject', id: string) {
    setError(null)
    setBusy({ id, kind: action })
    try {
      if (action === 'accept') {
        await acceptClaimFn({ data: { id } })
      } else {
        await rejectClaimFn({ data: { id } })
      }
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} claim`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardShell
      title="Claim requests"
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <PageHeader
        title="Claim requests"
        description="Approve, reject, and verify pickups for your active listings."
        back={{ to: '/restaurant/dashboard', label: 'Back to dashboard' }}
        actions={
          <Link to="/restaurant/listings">
            <Button
              variant="outline"
              leftIcon={<ListChecks className="h-4 w-4" />}
            >
              My listings
            </Button>
          </Link>
        }
      />

      {!canManage ? (
        <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white p-8 text-sm text-[var(--color-ink-2)]">
          {!isRestaurantOrg
            ? 'You need to own a restaurant organization to manage claim requests.'
            : 'Your organization must be verified before you can manage claim requests. An admin will review your profile shortly.'}
        </div>
      ) : (
        <>
          {error ? (
            <Alert tone="error" className="mb-4">
              {error}
            </Alert>
          ) : null}

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
              title={
                tab === 'active' ? 'No pending requests' : 'No past claims yet'
              }
              description={
                tab === 'active'
                  ? 'New requests from NGOs and animal rescues will appear here.'
                  : 'Completed and rejected claims will be archived here.'
              }
            />
          ) : (
            <div className="grid gap-3">
              {rows.map((claim) => (
                <RestaurantClaimCard
                  key={claim.id}
                  claim={claim}
                  busy={busy?.id === claim.id ? busy.kind : null}
                  disabled={busy != null && busy.id !== claim.id}
                  onAccept={() => handle('accept', claim.id)}
                  onReject={() => handle('reject', claim.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
