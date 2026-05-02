import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  CalendarClock,
  History,
  ListChecks,
  MapPin,
  Phone,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { listMyClaimsFn, type MyClaim } from '../../../lib/claim-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  ACTIVE_CLAIM_STATUSES,
  CLAIM_STATUS_BADGE_CLASSES,
  CLAIM_STATUS_LABELS,
  FOOD_TYPE_LABELS,
  ROLE_LABELS,
  canManageNgoClaims,
  roleToDashboard,
  type ClaimStatus,
  type FoodType,
} from '../../../lib/permissions'

type Tab = 'active' | 'history'

export const Route = createFileRoute('/_authed/ngo/my-claims')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
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
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
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
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/ngo/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        {canClaim ? (
          <Link
            to="/ngo/nearby-food"
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
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}

function ClaimCard({ claim }: { claim: MyClaim }) {
  const status = claim.status as ClaimStatus
  const l = claim.listing
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {l.title}
          </h3>
          <div className="text-xs text-gray-500">
            {l.restaurantName ?? 'Restaurant'}
            {l.cityName ? ` · ${l.cityName}` : ''}
            {' · claimed '}
            {new Date(claim.createdAt).toLocaleString()}
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${CLAIM_STATUS_BADGE_CLASSES[status] ?? ''}`}
        >
          {CLAIM_STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          icon={<Utensils className="h-3.5 w-3.5" />}
          label="Quantity"
          value={`${l.quantity} ${l.quantityUnit}`}
        />
        <Field
          icon={<Utensils className="h-3.5 w-3.5" />}
          label="Food type"
          value={FOOD_TYPE_LABELS[l.foodType as FoodType] ?? l.foodType}
        />
        <Field
          icon={<CalendarClock className="h-3.5 w-3.5" />}
          label="Pickup window"
          value={
            <>
              {formatTime(l.pickupStartTime)}
              <br />
              <span className="text-gray-500">
                → {formatTime(l.pickupEndTime)}
              </span>
            </>
          }
        />
        <Field
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Address"
          value={
            l.restaurantAddress?.trim() ||
            l.cityName ||
            `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}`
          }
        />
        {l.restaurantPhone ? (
          <Field
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Restaurant phone"
            value={
              status === 'ACCEPTED' || status === 'PICKED_UP' ? (
                <a
                  href={`tel:${l.restaurantPhone}`}
                  className="text-orange-600 hover:text-orange-700"
                >
                  {l.restaurantPhone}
                </a>
              ) : (
                'Available once accepted'
              )
            }
          />
        ) : null}
      </div>

      {status === 'PENDING' ? (
        <div className="border-t border-gray-100 bg-amber-50/50 px-4 py-2 text-xs text-amber-900">
          <ShoppingBag className="mr-1 inline h-3.5 w-3.5" />
          Waiting for the restaurant to accept your claim.
        </div>
      ) : null}
      {status === 'ACCEPTED' ? (
        <div className="border-t border-gray-100 bg-blue-50/50 px-4 py-2 text-xs text-blue-900">
          The restaurant accepted — head over during the pickup window.
        </div>
      ) : null}
    </article>
  )
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xs text-gray-900">{value}</div>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-1.5 text-[10px] ${
          active ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
