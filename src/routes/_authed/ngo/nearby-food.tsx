import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  MapPin,
  ShoppingBag,
  Utensils,
} from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import {
  createClaimFn,
  listNearbyHumanFoodFn,
  type NearbyListing,
} from '../../../lib/claim-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  FOOD_TYPE_LABELS,
  ROLE_LABELS,
  canManageNgoClaims,
  isOrgVerified,
  roleToDashboard,
  type FoodType,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/ngo/nearby-food')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'NGO' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => {
    const listings = await listNearbyHumanFoodFn().catch(() => [])
    return { listings }
  },
  component: NearbyFoodPage,
})

function NearbyFoodPage() {
  const router = useRouter()
  const { listings } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const canClaim = canManageNgoClaims(user, organization)
  const hasOrgLocation =
    organization?.latitude != null && organization?.longitude != null

  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClaim(listingId: string) {
    setError(null)
    setBusyId(listingId)
    try {
      await createClaimFn({ data: { id: listingId } })
      router.invalidate()
      await router.navigate({ to: '/ngo/my-claims' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim listing')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardShell
      title="Nearby human-safe food"
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
        <Link
          to="/ngo/my-claims"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ShoppingBag className="h-4 w-4" />
          My claims
        </Link>
      </div>

      {!canClaim ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-700 shadow-sm">
          {!organization || organization.type !== 'NGO'
            ? 'You need to own an NGO organization to claim human-safe food.'
            : isOrgVerified(organization)
              ? 'Only NGO accounts can claim human-safe food.'
              : 'Your organization must be verified before you can claim food. An admin will review your profile shortly.'}
        </div>
      ) : (
        <>
          {!hasOrgLocation ? (
            <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
              Add a location to your organization profile to see distances.
              Listings are still shown, sorted by earliest expiry.
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          ) : null}

          {listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
              No human-safe food available nearby right now.
              <div className="mt-1 text-xs">
                Check back in a little while — restaurants post throughout the day.
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  busy={busyId === listing.id}
                  disabled={busyId !== null && busyId !== listing.id}
                  onClaim={() => handleClaim(listing.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}

function ListingCard({
  listing,
  busy,
  disabled,
  onClaim,
}: {
  listing: NearbyListing
  busy: boolean
  disabled: boolean
  onClaim: () => void
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {listing.imageUrl ? (
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 text-orange-300">
          <Utensils className="h-10 w-10" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {listing.title}
          </h3>
          {listing.restaurantName ? (
            <div className="text-xs text-gray-500">
              {listing.restaurantName}
              {listing.cityName ? ` · ${listing.cityName}` : ''}
            </div>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs text-gray-700">
          <Field
            icon={<Utensils className="h-3.5 w-3.5" />}
            label="Quantity"
            value={`${listing.quantity} ${listing.quantityUnit}`}
          />
          <Field
            icon={<Utensils className="h-3.5 w-3.5" />}
            label="Type"
            value={
              FOOD_TYPE_LABELS[listing.foodType as FoodType] ?? listing.foodType
            }
          />
          <Field
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            label="Pickup"
            value={
              <>
                {formatTime(listing.pickupStartTime)}
                <br />
                <span className="text-gray-500">
                  → {formatTime(listing.pickupEndTime)}
                </span>
              </>
            }
          />
          <Field
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Expires"
            value={formatTime(listing.expiryTime)}
          />
          <Field
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Distance"
            value={
              listing.distanceKm != null
                ? formatDistance(listing.distanceKm)
                : 'Unknown'
            }
          />
          <Field
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Area"
            value={
              listing.restaurantAddress?.trim() ||
              listing.cityName ||
              `${listing.latitude.toFixed(4)}, ${listing.longitude.toFixed(4)}`
            }
          />
        </dl>

        <button
          type="button"
          onClick={onClaim}
          disabled={busy || disabled}
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <ShoppingBag className="h-4 w-4" />
          {busy ? 'Claiming…' : 'Claim'}
        </button>
      </div>
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
    <div className="rounded-lg bg-gray-50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xs text-gray-900">{value}</div>
    </div>
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

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}
