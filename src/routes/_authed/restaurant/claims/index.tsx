import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, History, ListChecks } from 'lucide-react'
import { DashboardShell } from '../../../../components/DashboardShell'
import { TabBtn } from '../../../../components/food/ClaimDashboardWidgets'
import { RestaurantClaimCard } from '../../../../components/food/RestaurantClaimCard'
import {
  acceptClaimFn,
  listClaimRequestsForRestaurantFn,
  rejectClaimFn,
} from '../../../../lib/claim-server'
import type { OrganizationRow } from '../../../../lib/org-server'
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
      throw redirect({ to: roleToDashboard(user.role) as string })
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
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }

  const verified = isOrgVerified(organization)
  const isRestaurantOrg =
    !!organization && organization.type === 'RESTAURANT'
  const canManage =
    user.role === 'ADMIN' || (isRestaurantOrg && verified)

  const [tab, setTab] = useState<Tab>('active')
  const [busy, setBusy] = useState<{ id: string; kind: 'accept' | 'reject' } | null>(null)
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
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/restaurant/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <Link
          to="/restaurant/listings"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ListChecks className="h-4 w-4" />
          My listings
        </Link>
      </div>

      {!canManage ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-700 shadow-sm">
          {!isRestaurantOrg
            ? 'You need to own a restaurant organization to manage claim requests.'
            : 'Your organization must be verified before you can manage claim requests. An admin will review your profile shortly.'}
        </div>
      ) : (
        <>
          {error ? (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          ) : null}

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
                ? 'No pending or accepted claims right now. New requests will appear here.'
                : 'No past claims yet.'}
            </div>
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
