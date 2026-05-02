import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { LayoutGrid, Map as MapIcon, MapPin, PawPrint, ShoppingBag } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { ListingsMap } from '../../../components/map/ListingsMap'
import type { ListingsMapMarker } from '../../../components/map/ListingsMap'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { FoodListingCard } from '../../../components/ui/FoodListingCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import {
  createAnimalClaimFn,
  listNearbyAnimalFoodFn,
} from '../../../lib/claim-server'
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
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  loader: async () => {
    const listings = await listNearbyAnimalFoodFn().catch(() => [])
    return { listings }
  },
  component: NearbyAnimalFoodPage,
})

type View = 'list' | 'map'

function NearbyAnimalFoodPage() {
  const router = useRouter()
  const { listings } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext()
  const canClaim = canManageAnimalClaims(user, organization)
  const hasOrgLocation =
    organization?.latitude != null && organization?.longitude != null

  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('list')

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

  const markers: ListingsMapMarker[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    latitude: l.latitude,
    longitude: l.longitude,
    distanceKm: l.distanceKm,
    expiryTime: l.expiryTime,
    pickupStartTime: l.pickupStartTime,
    pickupEndTime: l.pickupEndTime,
  }))

  return (
    <DashboardShell
      title="Nearby animal-safe food"
      roleLabel={ROLE_LABELS.ANIMAL_RESCUE}
      user={user}
      organization={organization}
    >
      <PageHeader
        title="Nearby food"
        description="Animal-safe surplus available within 10 km of your organization."
        eyebrow="Animal rescue"
        back={{ to: '/animal/dashboard', label: 'Back to dashboard' }}
        actions={
          <Link to="/animal/my-claims">
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
          {!organization || organization.type !== 'ANIMAL_RESCUE'
            ? 'You need to own an animal-rescue organization to claim animal-safe food.'
            : isOrgVerified(organization)
              ? 'Only animal-rescue accounts can claim animal-safe food.'
              : 'Your organization must be verified before you can claim food. An admin will review your profile shortly.'}
        </Alert>
      ) : (
        <div className="space-y-4">
          {!hasOrgLocation ? (
            <Alert tone="warning" title="Location missing">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Set your location to see nearby food. We match within 10 km of
                  your organization.
                </span>
                <Link to="/settings/organization">
                  <Button
                    size="sm"
                    leftIcon={<MapPin className="h-4 w-4" />}
                  >
                    Set your location
                  </Button>
                </Link>
              </div>
            </Alert>
          ) : null}

          {error ? <Alert tone="error">{error}</Alert> : null}

          {hasOrgLocation ? (
            <div className="inline-flex rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] p-1">
              <ToggleBtn
                active={view === 'list'}
                onClick={() => setView('list')}
                icon={<LayoutGrid className="h-4 w-4" />}
                label="List"
              />
              <ToggleBtn
                active={view === 'map'}
                onClick={() => setView('map')}
                icon={<MapIcon className="h-4 w-4" />}
                label="Map"
              />
            </div>
          ) : null}

          {!hasOrgLocation ? (
            <EmptyState
              icon={PawPrint}
              title="Set your organization location"
              description="We need your location to surface listings within 10 km."
              action={
                <Link to="/settings/organization">
                  <Button leftIcon={<MapPin className="h-4 w-4" />}>
                    Set your location
                  </Button>
                </Link>
              }
            />
          ) : view === 'map' ? (
            <ListingsMap
              origin={{
                latitude: organization!.latitude as number,
                longitude: organization!.longitude as number,
              }}
              markers={markers}
              radiusKm={10}
            />
          ) : listings.length === 0 ? (
            <EmptyState
              icon={PawPrint}
              title="No animal-safe food nearby right now"
              description="Restaurants post throughout the day — check back in a bit."
              action={
                <Link to="/animal/dashboard">
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

function ToggleBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? 'bg-[var(--color-canvas-3)] text-[var(--color-ink)]'
          : 'text-[var(--color-ink-2)] hover:bg-[var(--color-canvas-2)] hover:text-[var(--color-ink)]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
