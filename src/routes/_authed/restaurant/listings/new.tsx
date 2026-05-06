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
  head: () => ({ meta: [{ title: 'New listing · Restaurant | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const ctx = context as {
      user: { role?: string }
      organization: OrganizationRow | null
    }
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
      <div className="mb-5">
        <Link
          to="/restaurant/listings"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
      </div>

      {!canPost ? (
        <div className="squircle border-[1.5px] border-[var(--color-line)] bg-white p-8 text-sm text-[var(--color-ink-2)]">
          {!organization || organization.type !== 'RESTAURANT'
            ? 'You need to own a restaurant organization to post listings.'
            : isOrgVerified(organization)
              ? 'Only restaurant accounts can post listings.'
              : 'Your organization must be verified before you can post listings. An admin will review your profile shortly.'}
        </div>
      ) : (
        <div className="squircle border-[1.5px] border-[var(--color-line)] bg-white p-6 sm:p-8">
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
