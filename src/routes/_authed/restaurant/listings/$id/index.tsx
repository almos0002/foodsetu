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
import {
  cancelListingFn,
  getMyListingFn,
  type ListingRow,
} from '../../../../../lib/listing-server'
import type { OrganizationRow } from '../../../../../lib/org-server'
import {
  FOOD_CATEGORY_LABELS,
  FOOD_TYPE_LABELS,
  LISTING_STATUS_BADGE_CLASSES,
  LISTING_STATUS_LABELS,
  ROLE_LABELS,
  isListingCancelable,
  isListingEditable,
  roleToDashboard,
  type FoodCategory,
  type FoodType,
  type ListingStatus,
} from '../../../../../lib/permissions'

export const Route = createFileRoute('/_authed/restaurant/listings/$id/')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'RESTAURANT' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
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
      <h2 className="text-xl font-semibold text-gray-900">Listing not found</h2>
      <p className="mt-2 text-sm text-gray-600">
        This listing doesn&apos;t exist or doesn&apos;t belong to your organization.
      </p>
      <Link
        to="/restaurant/listings"
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
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
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }

  const status = listing.status as ListingStatus
  const editable = isListingEditable(status)
  const cancelable = isListingCancelable(status)

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleCancel() {
    if (!confirm('Cancel this listing? Claimants won\'t see it anymore.')) {
      return
    }
    setError(null)
    setBusy(true)
    try {
      await cancelListingFn({ data: { id: listing.id } })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel listing')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardShell
      title={listing.title}
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/restaurant/listings"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${LISTING_STATUS_BADGE_CLASSES[status] ?? ''}`}
        >
          {LISTING_STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-64 w-full rounded-xl object-cover ring-1 ring-gray-200"
            />
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-800">
              {listing.description?.trim()
                ? listing.description
                : 'No description provided.'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailCard
              icon={<Utensils className="h-4 w-4" />}
              label="Food"
              value={`${FOOD_CATEGORY_LABELS[listing.foodCategory as FoodCategory] ?? listing.foodCategory} · ${FOOD_TYPE_LABELS[listing.foodType as FoodType] ?? listing.foodType}`}
            />
            <DetailCard
              icon={<Utensils className="h-4 w-4" />}
              label="Quantity"
              value={`${listing.quantity} ${listing.quantityUnit}`}
            />
            <DetailCard
              icon={<CalendarClock className="h-4 w-4" />}
              label="Pickup window"
              value={
                <>
                  {new Date(listing.pickupStartTime).toLocaleString()}
                  <br />
                  <span className="text-gray-500">
                    → {new Date(listing.pickupEndTime).toLocaleString()}
                  </span>
                </>
              }
            />
            <DetailCard
              icon={<Clock className="h-4 w-4" />}
              label="Expires"
              value={new Date(listing.expiryTime).toLocaleString()}
            />
            <DetailCard
              icon={<MapPin className="h-4 w-4" />}
              label="Location"
              value={`${listing.latitude.toFixed(5)}, ${listing.longitude.toFixed(5)}`}
            />
            <DetailCard
              icon={<Clock className="h-4 w-4" />}
              label="Created"
              value={new Date(listing.createdAt).toLocaleString()}
            />
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
            <p className="mt-1 text-xs text-gray-500">
              {editable
                ? 'You can edit this listing while it is still available.'
                : 'This listing can no longer be edited.'}
            </p>
            <div className="mt-4 space-y-2">
              <Link
                to="/restaurant/listings/$id/edit"
                params={{ id: listing.id }}
                aria-disabled={!editable}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
                  editable
                    ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                    : 'pointer-events-none border-gray-200 text-gray-400'
                }`}
              >
                <Pencil className="h-4 w-4" />
                Edit listing
              </Link>
              <button
                type="button"
                onClick={handleCancel}
                disabled={!cancelable || busy}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:pointer-events-none disabled:border-gray-200 disabled:bg-white disabled:text-gray-400"
              >
                <Ban className="h-4 w-4" />
                {busy ? 'Cancelling…' : cancelable ? 'Cancel listing' : 'Not cancelable'}
              </button>
            </div>
          </div>

          <ListingMeta listing={listing} />
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm text-gray-900">{value}</div>
    </div>
  )
}

function ListingMeta({ listing }: { listing: ListingRow }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 text-xs text-gray-500 shadow-sm">
      <div className="font-mono">{listing.id}</div>
      <div className="mt-1">
        Updated {new Date(listing.updatedAt).toLocaleString()}
      </div>
    </div>
  )
}
