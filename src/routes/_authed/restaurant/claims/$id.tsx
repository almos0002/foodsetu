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
  CheckCircle2,
  Clock,
  Flag,
  KeyRound,
  MapPin,
  Phone,
  ShieldCheck,
  Utensils,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { DashboardShell } from '../../../../components/DashboardShell'
import { Alert } from '../../../../components/ui/Alert'
import { Button } from '../../../../components/ui/Button'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/Card'
import { ClaimStatusBadge } from '../../../../components/ui/ClaimStatusBadge'
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog'
import { PageHeader } from '../../../../components/ui/PageHeader'
import {
  acceptClaimFn,
  getClaimForRestaurantFn,
  rejectClaimFn,
  verifyPickupFn,
} from '../../../../lib/claim-server'
import {
  CLAIM_STATUS_LABELS,
  FOOD_CATEGORY_LABELS,
  FOOD_TYPE_LABELS,
  ROLE_LABELS,
  isOrgVerified,
  roleToDashboard,
} from '../../../../lib/permissions'
import type {
  ClaimStatus,
  FoodCategory,
  FoodType,
} from '../../../../lib/permissions'

const CLAIMANT_ORG_TYPE_LABELS: Record<string, string> = {
  NGO: 'NGO',
  ANIMAL_RESCUE: 'Animal rescue',
  RESTAURANT: 'Restaurant',
}

export const Route = createFileRoute('/_authed/restaurant/claims/$id')({
  head: () => ({ meta: [{ title: 'Claim detail · Restaurant | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) })
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
  const { user, organization } = Route.useRouteContext()

  const status = claim.status as ClaimStatus
  const isPending = status === 'PENDING'
  const isAccepted = status === 'ACCEPTED'
  const isCompleted = status === 'COMPLETED'
  const verified = isOrgVerified(organization)
  const isRestaurantOrg = !!organization && organization.type === 'RESTAURANT'
  const canManage = user.role === 'ADMIN' || (isRestaurantOrg && verified)

  const [busy, setBusy] = useState<'accept' | 'reject' | 'verify' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [confirmReject, setConfirmReject] = useState(false)

  async function doAccept() {
    setError(null)
    setSuccess(null)
    setBusy('accept')
    try {
      await acceptClaimFn({ data: { id: claim.id } })
      setSuccess(
        'Claim accepted. A 6-digit pickup OTP was issued to the claimant.',
      )
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept claim')
    } finally {
      setBusy(null)
    }
  }

  async function doReject() {
    setError(null)
    setSuccess(null)
    setBusy('reject')
    try {
      await rejectClaimFn({ data: { id: claim.id } })
      setSuccess('Claim rejected. The listing is available again.')
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject claim')
    } finally {
      setBusy(null)
      setConfirmReject(false)
    }
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const otp = otpInput.replace(/\D/g, '')
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP shown by the claimant.')
      return
    }
    setBusy('verify')
    try {
      await verifyPickupFn({ data: { id: claim.id, otp } })
      setSuccess('Pickup verified. The handoff is complete — thank you!')
      setOtpInput('')
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify pickup')
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
      <PageHeader
        title={l.title}
        eyebrow="Claim request"
        description={`Requested ${new Date(claim.createdAt).toLocaleString()}`}
        back={{ to: '/restaurant/claims', label: 'Back to claim requests' }}
        actions={<ClaimStatusBadge status={status} />}
      />

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success" className="mb-4">
          {success}
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {l.imageUrl ? (
            <img
              src={l.imageUrl}
              alt={l.title}
              className="h-56 w-full rounded-lg border border-gray-200 object-cover"
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Listing details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid gap-2 sm:grid-cols-2">
                <DetailCard
                  icon={<Utensils className="h-3.5 w-3.5" />}
                  label="Food"
                  value={`${FOOD_CATEGORY_LABELS[l.foodCategory as FoodCategory] ?? l.foodCategory} · ${FOOD_TYPE_LABELS[l.foodType as FoodType] ?? l.foodType}`}
                />
                <DetailCard
                  icon={<Utensils className="h-3.5 w-3.5" />}
                  label="Quantity"
                  value={`${l.quantity} ${l.quantityUnit}`}
                />
                <DetailCard
                  icon={<CalendarClock className="h-3.5 w-3.5" />}
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
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Expires"
                  value={new Date(l.expiryTime).toLocaleString()}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Claimant</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="grid gap-2 sm:grid-cols-2">
                <DetailCard
                  icon={<Building2 className="h-3.5 w-3.5" />}
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
                    icon={<Phone className="h-3.5 w-3.5" />}
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
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label="Address"
                    value={c.orgAddress}
                  />
                ) : null}
              </div>
              {claim.notes?.trim() ? (
                <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    Notes from claimant
                  </div>
                  <div className="mt-1 whitespace-pre-line">{claim.notes}</div>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {claim.otpIssued && isAccepted ? (
            <Alert
              tone="info"
              title={
                <span className="inline-flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4" />
                  Pickup OTP issued
                </span>
              }
            >
              The claimant has a 6-digit code. Ask them for it at handoff and
              enter it on the right to confirm the pickup. (For security, the
              code is never shown to you here.)
            </Alert>
          ) : null}

          {isCompleted ? (
            <Alert
              tone="success"
              title={
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Pickup verified
                </span>
              }
            >
              You confirmed the OTP and the food has been handed off. The
              listing is now marked as picked up.
            </Alert>
          ) : null}
        </div>

        <aside className="space-y-3">
          {isPending || (!isAccepted && !isCompleted) ? (
            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-xs text-gray-500">
                  {!canManage
                    ? 'Your organization must be verified to act on claims.'
                    : isPending
                      ? 'Accept to lock the listing for this claimant and issue a pickup OTP. Reject to release the listing back to AVAILABLE.'
                      : `This claim is ${(CLAIM_STATUS_LABELS[status] ?? status).toLowerCase()} and can no longer be changed.`}
                </p>
                <div className="mt-3 space-y-2">
                  <Button
                    fullWidth
                    onClick={doAccept}
                    disabled={!canManage || !isPending || busy != null}
                    leftIcon={<Check className="h-4 w-4" />}
                  >
                    {busy === 'accept' ? 'Accepting…' : 'Accept claim'}
                  </Button>
                  <Button
                    fullWidth
                    variant="destructive"
                    onClick={() => setConfirmReject(true)}
                    disabled={!canManage || !isPending || busy != null}
                    leftIcon={<X className="h-4 w-4" />}
                  >
                    {busy === 'reject' ? 'Rejecting…' : 'Reject claim'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {isAccepted ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-orange-600" />
                    Verify pickup
                  </span>
                </CardTitle>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleVerify}>
                  <p className="text-xs text-gray-500">
                    Ask the claimant for their 6-digit pickup OTP and enter it
                    here. On a successful match, the listing is marked as picked
                    up and this claim is completed.
                  </p>
                  <label
                    htmlFor="otp"
                    className="mt-3 block text-[10px] font-medium uppercase tracking-wide text-gray-500"
                  >
                    Pickup OTP
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={7}
                    placeholder="000000"
                    value={otpInput}
                    onChange={(e) =>
                      setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    disabled={!canManage || busy != null}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-gray-900 placeholder:text-gray-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    disabled={
                      !canManage || busy != null || otpInput.length !== 6
                    }
                    leftIcon={<ShieldCheck className="h-4 w-4" />}
                    className="mt-3"
                  >
                    {busy === 'verify' ? 'Verifying…' : 'Verify pickup'}
                  </Button>
                  {!canManage ? (
                    <p className="mt-2 text-[11px] text-gray-500">
                      Your organization must be verified before you can confirm
                      pickups.
                    </p>
                  ) : null}
                </form>
              </CardBody>
            </Card>
          ) : null}

          {isCompleted ? (
            <Alert
              tone="success"
              title={
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Pickup complete
                </span>
              }
            >
              This claim has been verified and closed out.
            </Alert>
          ) : null}

          <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs text-gray-500">
            <div className="font-mono break-all">{claim.id}</div>
            <div className="mt-1">
              Updated {new Date(claim.updatedAt).toLocaleString()}
            </div>
            <Link
              to="/reports/new"
              search={{ listingId: l.id, claimId: claim.id }}
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700"
            >
              <Flag className="h-3 w-3" />
              Report a problem with this claim
            </Link>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmReject}
        title="Reject this claim?"
        description="The listing will be released back to AVAILABLE so other organizations can claim it."
        confirmLabel="Reject"
        cancelLabel="Keep pending"
        destructive
        busy={busy === 'reject'}
        onConfirm={doReject}
        onCancel={() => setConfirmReject(false)}
      />
    </DashboardShell>
  )
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
}) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  )
}
