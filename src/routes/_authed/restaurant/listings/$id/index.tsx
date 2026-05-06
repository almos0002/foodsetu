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
  Ban,
  CalendarClock,
  Clock,
  MapPin,
  Pencil,
  Utensils,
} from 'lucide-react'
import { DashboardShell } from '../../../../../components/DashboardShell'
import { Alert } from '../../../../../components/ui/Alert'
import { Button } from '../../../../../components/ui/Button'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '../../../../../components/ui/Card'
import { ListingStatusBadge } from '../../../../../components/ui/ClaimStatusBadge'
import { ConfirmDialog } from '../../../../../components/ui/ConfirmDialog'
import { PageHeader } from '../../../../../components/ui/PageHeader'
import {
  cancelListingFn,
  getMyListingFn,
} from '../../../../../lib/listing-server'
import type { ListingRow } from '../../../../../lib/listing-server'
import {
  FOOD_CATEGORY_LABELS,
  FOOD_TYPE_LABELS,
  ROLE_LABELS,
  isListingCancelable,
  isListingEditable,
  roleToDashboard,
} from '../../../../../lib/permissions'
import type { FoodCategory, FoodType } from '../../../../../lib/permissions'
import { fullDateTime } from '../../../../../lib/time'

export const Route = createFileRoute('/_authed/restaurant/listings/$id/')({
  head: () => ({ meta: [{ title: 'Listing detail · Restaurant | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  loader: async ({ params }) => {
    try {
      const listing = await getMyListingFn({ data: { id: params.id } })
      return { listing }
    } catch (err) {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        throw notFound()
      }
      throw err
    }
  },
  component: ListingDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
        Listing not found
      </h2>
      <p className="mt-2 text-sm text-[var(--color-ink-2)]">
        This listing doesn&apos;t exist or doesn&apos;t belong to your
        organization.
      </p>
      <Link
        to="/restaurant/listings"
        className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-[var(--color-coral)] hover:text-[var(--color-coral-2)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to listings
      </Link>
    </div>
  ),
})

function ListingDetail() {
  const router = useRouter()
  const { listing } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext()

  const status = listing.status
  const editable = isListingEditable(status)
  const cancelable = isListingCancelable(status)

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleCancel() {
    setError(null)
    setBusy(true)
    try {
      await cancelListingFn({ data: { id: listing.id } })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel listing')
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  return (
    <DashboardShell
      title={listing.title}
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <PageHeader
        title={listing.title}
        eyebrow="Listing"
        back={{ to: '/restaurant/listings', label: 'Back to listings' }}
        actions={<ListingStatusBadge status={status} />}
      />

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-72 w-full squircle border border-[var(--color-line)] object-cover"
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-line text-sm text-[var(--color-ink-2)]">
                {listing.description?.trim()
                  ? listing.description
                  : 'No description provided.'}
              </p>
            </CardBody>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailCard
              icon={<Utensils className="h-3.5 w-3.5" />}
              label="Food"
              value={`${FOOD_CATEGORY_LABELS[listing.foodCategory as FoodCategory] ?? listing.foodCategory} · ${FOOD_TYPE_LABELS[listing.foodType as FoodType] ?? listing.foodType}`}
            />
            <DetailCard
              icon={<Utensils className="h-3.5 w-3.5" />}
              label="Quantity"
              value={`${listing.quantity} ${listing.quantityUnit}`}
            />
            <DetailCard
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              label="Pickup window"
              value={
                <>
                  {fullDateTime(listing.pickupStartTime)}
                  <br />
                  <span className="text-[var(--color-ink-3)]">
                    → {fullDateTime(listing.pickupEndTime)}
                  </span>
                </>
              }
            />
            <DetailCard
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Expires"
              value={fullDateTime(listing.expiryTime)}
            />
            <DetailCard
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Location"
              value={`${listing.latitude.toFixed(5)}, ${listing.longitude.toFixed(5)}`}
            />
            <DetailCard
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Created"
              value={fullDateTime(listing.createdAt)}
            />
          </div>
        </div>

        <aside className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-xs text-[var(--color-ink-3)]">
                {editable
                  ? 'You can edit this listing while it is still available.'
                  : 'This listing can no longer be edited.'}
              </p>
              <div className="mt-3 space-y-2">
                <Link
                  to="/restaurant/listings/$id/edit"
                  params={{ id: listing.id }}
                  aria-disabled={!editable}
                  className={
                    editable ? 'block' : 'pointer-events-none block opacity-50'
                  }
                >
                  <Button
                    fullWidth
                    variant="outline"
                    leftIcon={<Pencil className="h-4 w-4" />}
                    disabled={!editable}
                  >
                    Edit listing
                  </Button>
                </Link>
                <Button
                  fullWidth
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!cancelable || busy}
                  leftIcon={<Ban className="h-4 w-4" />}
                >
                  {busy
                    ? 'Cancelling…'
                    : cancelable
                      ? 'Cancel listing'
                      : 'Not cancelable'}
                </Button>
              </div>
            </CardBody>
          </Card>

          <ListingMeta listing={listing} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Cancel this listing?"
        description="Claimants won't see it anymore. Any pending claim will also be released."
        confirmLabel="Cancel listing"
        cancelLabel="Keep active"
        destructive
        busy={busy}
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
      />
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
    <div className="squircle border border-[var(--color-line)] bg-white p-4">
      <div className="tiny-cap flex items-center gap-1.5 text-[var(--color-ink-3)]">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  )
}

function ListingMeta({ listing }: { listing: ListingRow }) {
  return (
    <div className="squircle border border-[var(--color-line)] bg-[var(--color-cream)] p-4 text-xs text-[var(--color-ink-3)]">
      <div className="font-mono break-all">{listing.id}</div>
      <div className="mt-1">Updated {fullDateTime(listing.updatedAt)}</div>
    </div>
  )
}
