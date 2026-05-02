import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { NearbyFoodCard } from '../../../components/food/NearbyFoodCard'
import {
  createClaimFn,
  listNearbyHumanFoodFn,
} from '../../../lib/claim-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  ROLE_LABELS,
  canManageNgoClaims,
  isOrgVerified,
  roleToDashboard,
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
              Add a location to your organization profile to see nearby
              listings. We match within 10 km of your location.
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          ) : null}

          {listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
              {hasOrgLocation
                ? 'No human-safe food available within 10 km right now.'
                : 'Set your organization location to see nearby food.'}
              <div className="mt-1 text-xs">
                Check back in a little while — restaurants post throughout the day.
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <NearbyFoodCard
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
