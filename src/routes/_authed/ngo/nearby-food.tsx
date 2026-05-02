import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { MapPin, ShoppingBag, Utensils } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { FoodListingCard } from '../../../components/ui/FoodListingCard'
import { PageHeader } from '../../../components/ui/PageHeader'
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
      <PageHeader
        title="Nearby food"
        description="Human-safe surplus available within 10 km of your organization."
        eyebrow="NGO"
        back={{ to: '/ngo/dashboard', label: 'Back to dashboard' }}
        actions={
          <Link to="/ngo/my-claims">
            <Button
              variant="outline"
              leftIcon={<ShoppingBag className="h-4 w-4" />}
            >
              My claims
            </Button>
          </Link>
        }
      />

      {!canClaim ? (
        <Alert tone="warning" title="Not available yet">
          {!organization || organization.type !== 'NGO'
            ? 'You need to own an NGO organization to claim human-safe food.'
            : isOrgVerified(organization)
              ? 'Only NGO accounts can claim human-safe food.'
              : 'Your organization must be verified before you can claim food. An admin will review your profile shortly.'}
        </Alert>
      ) : (
        <div className="space-y-4">
          {!hasOrgLocation ? (
            <Alert tone="warning" title="Location missing">
              Add a location to your organization profile to see nearby
              listings. We match within 10 km of your location.
            </Alert>
          ) : null}

          {error ? <Alert tone="error">{error}</Alert> : null}

          {listings.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title={
                hasOrgLocation
                  ? 'No human-safe food nearby right now'
                  : 'Set your organization location'
              }
              description={
                hasOrgLocation
                  ? 'Restaurants post throughout the day — check back in a bit.'
                  : 'We need your location to surface listings within 10 km.'
              }
              action={
                <Link to="/ngo/dashboard">
                  <Button
                    variant="outline"
                    leftIcon={<MapPin className="h-4 w-4" />}
                  >
                    Back to dashboard
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <FoodListingCard
                  key={listing.id}
                  listing={listing}
                  action={{
                    label: 'Claim',
                    busyLabel: 'Claiming…',
                    busy: busyId === listing.id,
                    disabled: busyId !== null && busyId !== listing.id,
                    onClick: () => handleClaim(listing.id),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
