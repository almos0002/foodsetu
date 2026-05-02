import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { DashboardShell } from '../../../../components/DashboardShell'
import { ListingForm } from '../../../../components/ListingForm'
import { createListingFn } from '../../../../lib/listing-server'
import type { OrganizationRow } from '../../../../lib/org-server'
import {
  ROLE_LABELS,
  canManageRestaurantListings,
  isOrgVerified,
  roleToDashboard,
} from '../../../../lib/permissions'

export const Route = createFileRoute('/_authed/restaurant/listings/new')({
  beforeLoad: ({ context }) => {
    const ctx = context as {
      user: { role?: string }
      organization: OrganizationRow | null
    }
    // Plain role guard for navigation (mirrors other restaurant routes).
    // Verification is checked inside the page so verified users see the form
    // and unverified users see a friendly message instead of being bounced
    // (which prevents redirect loops).
    if (ctx.user.role !== 'RESTAURANT' && ctx.user.role !== 'ADMIN') {
      throw redirect({ to: roleToDashboard(ctx.user.role) })
    }
  },
  component: NewListingPage,
})

function NewListingPage() {
  const router = useRouter()
  const { user, organization } = Route.useRouteContext()
  const canPost = canManageRestaurantListings(user, organization)

  return (
    <DashboardShell
      title="New food listing"
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <div className="mb-4">
        <Link
          to="/restaurant/listings"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
      </div>

      {!canPost ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-700">
          {!organization || organization.type !== 'RESTAURANT'
            ? 'You need to own a restaurant organization to post listings.'
            : isOrgVerified(organization)
              ? 'Only restaurant accounts can post listings.'
              : 'Your organization must be verified before you can post listings. An admin will review your profile shortly.'}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
          <ListingForm
            submitLabel="Publish listing"
            defaultLatitude={organization?.latitude ?? null}
            defaultLongitude={organization?.longitude ?? null}
            onSubmit={async (data) => {
              const created = await createListingFn({ data })
              router.invalidate()
              await router.navigate({
                to: '/restaurant/listings/$id',
                params: { id: created.id },
              })
            }}
            onCancel={() => router.history.back()}
          />
        </div>
      )}
    </DashboardShell>
  )
}
