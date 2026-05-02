import {
  Link,
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Check,
  Clock,
  KeyRound,
  MapPin,
  Phone,
  Utensils,
  X,
} from 'lucide-react'
import { DashboardShell } from '../../../../components/DashboardShell'
import {
  acceptClaimFn,
  getClaimForRestaurantFn,
  rejectClaimFn,
} from '../../../../lib/claim-server'
import type { OrganizationRow } from '../../../../lib/org-server'
import {
  CLAIM_STATUS_BADGE_CLASSES,
  CLAIM_STATUS_LABELS,
  FOOD_CATEGORY_LABELS,
  FOOD_TYPE_LABELS,
  ROLE_LABELS,
  isOrgVerified,
  roleToDashboard,
  type ClaimStatus,
  type FoodCategory,
  type FoodType,
} from '../../../../lib/permissions'

const CLAIMANT_ORG_TYPE_LABELS: Record<string, string> = {
  NGO: 'NGO',
  ANIMAL_RESCUE: 'Animal rescue',
  RESTAURANT: 'Restaurant',
}

export const Route = createFileRoute('/_authed/restaurant/claims/$id')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async ({ params }) => {
    try {
      const claim = await getClaimForRestaurantFn({ data: { id: params.id } })
      return { claim }
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        throw notFound()
      }
      throw err
    }
  },
  component: RestaurantClaimDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h2 className="text-xl font-semibold text-gray-900">Claim not found</h2>
      <p className="mt-2 text-sm text-gray-600">
        This claim doesn&apos;t exist or doesn&apos;t belong to one of your
        listings.
      </p>
      <Link
        to="/restaurant/claims"
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to claim requests
      </Link>
    </div>
  ),
})

function RestaurantClaimDetail() {
  const router = useRouter()
  const { claim } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }

  const status = claim.status as ClaimStatus
  const isPending = status === 'PENDING'
  const verified = isOrgVerified(organization)
  const isRestaurantOrg =
    !!organization && organization.type === 'RESTAURANT'
  const canManage =
    user.role === 'ADMIN' || (isRestaurantOrg && verified)

  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handle(action: 'accept' | 'reject') {
    if (
      action === 'reject' &&
      !confirm('Reject this claim? The listing will return to AVAILABLE.')
    ) {
      return
    }
    setError(null)
    setBusy(action)
    try {
      if (action === 'accept') {
        await acceptClaimFn({ data: { id: claim.id } })
      } else {
        await rejectClaimFn({ data: { id: claim.id } })
      }
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} claim`)
    } finally {
      setBusy(null)
    }
  }

  const c = claim.claimant
  const l = claim.listing

  return (
    <DashboardShell
      title="Claim request"
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/restaurant/claims"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to claim requests
        </Link>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${CLAIM_STATUS_BADGE_CLASSES[status] ?? ''}`}
        >
          {CLAIM_STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {l.imageUrl ? (
            <img
              src={l.imageUrl}
              alt={l.title}
              className="h-56 w-full rounded-xl object-cover ring-1 ring-gray-200"
            />
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">
              {l.title}
            </h2>
            <div className="mt-1 text-xs text-gray-500">
              Requested {new Date(claim.createdAt).toLocaleString()}
              {l.cityName ? ` · ${l.cityName}` : ''}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailCard
                icon={<Utensils className="h-4 w-4" />}
                label="Food"
                value={`${FOOD_CATEGORY_LABELS[l.foodCategory as FoodCategory] ?? l.foodCategory} · ${FOOD_TYPE_LABELS[l.foodType as FoodType] ?? l.foodType}`}
              />
              <DetailCard
                icon={<Utensils className="h-4 w-4" />}
                label="Quantity"
                value={`${l.quantity} ${l.quantityUnit}`}
              />
              <DetailCard
                icon={<CalendarClock className="h-4 w-4" />}
                label="Pickup window"
                value={
                  <>
                    {new Date(l.pickupStartTime).toLocaleString()}
                    <br />
                    <span className="text-gray-500">
                      → {new Date(l.pickupEndTime).toLocaleString()}
                    </span>
                  </>
                }
              />
              <DetailCard
                icon={<Clock className="h-4 w-4" />}
                label="Expires"
                value={new Date(l.expiryTime).toLocaleString()}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Claimant
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <DetailCard
                icon={<Building2 className="h-4 w-4" />}
                label="Organization"
                value={
                  <>
                    <div className="font-medium text-gray-900">
                      {c.orgName ?? '—'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {(c.orgType && CLAIMANT_ORG_TYPE_LABELS[c.orgType]) ??
                        c.orgType ??
                        ''}
                      {c.cityName ? ` · ${c.cityName}` : ''}
                    </div>
                  </>
                }
              />
              {c.orgPhone ? (
                <DetailCard
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={
                    <a
                      href={`tel:${c.orgPhone}`}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      {c.orgPhone}
                    </a>
                  }
                />
              ) : null}
              {c.orgAddress?.trim() ? (
                <DetailCard
                  icon={<MapPin className="h-4 w-4" />}
                  label="Address"
                  value={c.orgAddress}
                />
              ) : null}
            </div>
            {claim.notes?.trim() ? (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  Notes from claimant
                </div>
                <div className="mt-1 whitespace-pre-line">{claim.notes}</div>
              </div>
            ) : null}
          </div>

          {claim.otpIssued && (status === 'ACCEPTED' || status === 'PICKED_UP') ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
              <div className="flex items-center gap-2 font-medium">
                <KeyRound className="h-4 w-4" />
                Pickup OTP issued
              </div>
              <p className="mt-1 text-xs text-blue-800">
                The claimant has a 6-digit code. Ask them for it at handoff —
                you&apos;ll enter it to confirm the pickup. (For security, the
                code is never shown here.)
              </p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Decision</h3>
            <p className="mt-1 text-xs text-gray-500">
              {!canManage
                ? 'Your organization must be verified to act on claims.'
                : isPending
                  ? 'Accept to lock the listing for this claimant and issue a pickup OTP. Reject to release the listing back to AVAILABLE.'
                  : `This claim is ${(CLAIM_STATUS_LABELS[status] ?? status).toLowerCase()} and can no longer be changed.`}
            </p>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => handle('accept')}
                disabled={!canManage || !isPending || busy != null}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Check className="h-4 w-4" />
                {busy === 'accept' ? 'Accepting…' : 'Accept claim'}
              </button>
              <button
                type="button"
                onClick={() => handle('reject')}
                disabled={!canManage || !isPending || busy != null}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
              >
                <X className="h-4 w-4" />
                {busy === 'reject' ? 'Rejecting…' : 'Reject claim'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 text-xs text-gray-500 shadow-sm">
            <div className="font-mono">{claim.id}</div>
            <div className="mt-1">
              Updated {new Date(claim.updatedAt).toLocaleString()}
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  )
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  )
}
