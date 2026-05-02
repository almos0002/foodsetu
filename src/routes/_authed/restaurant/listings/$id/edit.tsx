import {
  Link,
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { DashboardShell } from '../../../../../components/DashboardShell'
import { ListingForm } from '../../../../../components/ListingForm'
import {
  getMyListingFn,
  updateListingFn,
} from '../../../../../lib/listing-server'
import {
  ROLE_LABELS,
  isListingEditable,
  roleToDashboard,
} from '../../../../../lib/permissions'

export const Route = createFileRoute('/_authed/restaurant/listings/$id/edit')({
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
  component: EditListingPage,
})

function EditListingPage() {
  const router = useRouter()
  const { listing } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext()
  const editable = isListingEditable(listing.status)

  return (
    <DashboardShell
      title={`Edit: ${listing.title}`}
      roleLabel={ROLE_LABELS.RESTAURANT}
      user={user}
      organization={organization}
    >
      <div className="mb-5">
        <Link
          to="/restaurant/listings/$id"
          params={{ id: listing.id }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listing
        </Link>
      </div>

      {!editable ? (
        <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white p-8 text-sm text-[var(--color-ink-2)]">
          This listing is in status{' '}
          <span className="font-bold text-[var(--color-ink)]">
            {listing.status}
          </span>{' '}
          and can no longer be edited.
        </div>
      ) : (
        <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white p-6 sm:p-8">
          <ListingForm
            initial={listing}
            submitLabel="Save changes"
            onSubmit={async (data) => {
              await updateListingFn({ data: { id: listing.id, data } })
              router.invalidate()
              await router.navigate({
                to: '/restaurant/listings/$id',
                params: { id: listing.id },
              })
            }}
            onCancel={() =>
              router.navigate({
                to: '/restaurant/listings/$id',
                params: { id: listing.id },
              })
            }
          />
        </div>
      )}
    </DashboardShell>
  )
}
