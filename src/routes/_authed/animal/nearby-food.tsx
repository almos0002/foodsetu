import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { NearbyFoodCard } from '../../../components/food/NearbyFoodCard'
import {
  createAnimalClaimFn,
  listNearbyAnimalFoodFn,
} from '../../../lib/claim-server'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  ROLE_LABELS,
  canManageAnimalClaims,
  isOrgVerified,
  roleToDashboard,
} from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/animal/nearby-food')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (user.role !== 'ANIMAL_RESCUE' && user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(user.role) as string })
    }
  },
  loader: async () => {
    const listings = await listNearbyAnimalFoodFn().catch(() => [])
    return { listings }
  },
  component: NearbyAnimalFoodPage,
})

function NearbyAnimalFoodPage() {
  const router = useRouter()
  const { listings } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }
  const canClaim = canManageAnimalClaims(user, organization)
  const hasOrgLocation =
    organization?.latitude != null && organization?.longitude != null

  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClaim(listingId: string) {
    setError(null)
    setBusyId(listingId)
    try {
      await createAnimalClaimFn({ data: { id: listingId } })
      router.invalidate()
      await router.navigate({ to: '/animal/my-claims' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim listing')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DashboardShell
      title="Nearby animal-safe food"
      roleLabel={ROLE_LABELS.ANIMAL_RESCUE}
      user={user}
      organization={organization}
    >
      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/animal/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <Link
          to="/animal/my-claims"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ShoppingBag className="h-4 w-4" />
          My claims
        </Link>
      </div>

      {!canClaim ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-700 shadow-sm">
          {!organization || organization.type !== 'ANIMAL_RESCUE'
            ? 'You need to own an animal-rescue organization to claim animal-safe food.'
            : isOrgVerified(organization)
              ? 'Only animal-rescue accounts can claim animal-safe food.'
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
              No animal-safe food available nearby right now.
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
