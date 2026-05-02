import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { LocationPicker } from '../../../components/map/LocationPicker'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { PageHeader } from '../../../components/ui/PageHeader'
import {
  getMyOrganizationFn,
  listCitiesFn,
  updateMyOrganizationFn,
} from '../../../lib/org-server'
import { ROLE_LABELS, roleToDashboard } from '../../../lib/permissions'
import type { Role } from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/settings/organization')({
  head: () => ({ meta: [{ title: 'Organization settings | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (
      user.role !== 'RESTAURANT' &&
      user.role !== 'NGO' &&
      user.role !== 'ANIMAL_RESCUE'
    ) {
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  loader: async () => {
    const [organization, cities] = await Promise.all([
      getMyOrganizationFn(),
      listCitiesFn(),
    ])
    return { organization, cities }
  },
  component: OrganizationSettingsPage,
})

const inputCls =
  'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-colors focus:border-[var(--color-ink)] focus:outline-none'

function OrganizationSettingsPage() {
  const router = useRouter()
  const { organization, cities } = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  const [name, setName] = useState(organization?.name ?? '')
  const [description, setDescription] = useState(organization?.description ?? '')
  const [phone, setPhone] = useState(organization?.phone ?? '')
  const [address, setAddress] = useState(organization?.address ?? '')
  const [cityId, setCityId] = useState(organization?.cityId ?? '')
  const [latitude, setLatitude] = useState<number | null>(
    organization?.latitude ?? null,
  )
  const [longitude, setLongitude] = useState<number | null>(
    organization?.longitude ?? null,
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!cityId && cities.length > 0) setCityId(cities[0].id)
  }, [cities, cityId])

  const roleLabel =
    user.role && user.role in ROLE_LABELS
      ? ROLE_LABELS[user.role as Role]
      : 'Member'

  function isInNepalBounds(lat: number, lng: number): boolean {
    return lat >= 26 && lat <= 31 && lng >= 80 && lng <= 89
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (latitude == null || longitude == null) {
      setError('Please pick your location on the map')
      return
    }
    if (!isInNepalBounds(latitude, longitude)) {
      setError(
        'Your selected coordinates are outside Nepal. Pick a point inside Nepal on the map.',
      )
      return
    }
    setSubmitting(true)
    try {
      await updateMyOrganizationFn({
        data: {
          name,
          description: description || undefined,
          phone: phone || undefined,
          address: address || undefined,
          cityId: cityId || null,
          latitude,
          longitude,
        },
      })
      setSuccess('Organization updated')
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardShell
      title="Organization settings"
      roleLabel={roleLabel}
      user={user}
      organization={organization}
    >
      <PageHeader
        title="Organization settings"
        description="Update your organization profile and pickup location."
        eyebrow="Settings"
      />

      <div className="rounded-[24px] border border-[var(--color-line)] bg-white p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Organization name" required>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className={inputCls}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                className={inputCls}
                placeholder="+977 …"
              />
            </Field>
            <Field label="City">
              {cities.length > 0 ? (
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className={inputCls}
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.state ? `, ${c.state}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-2)] px-3.5 py-2.5 text-sm text-[var(--color-ink-3)]">
                  No cities seeded yet.
                </div>
              )}
            </Field>
          </div>

          <Field label="Address">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
              className={inputCls}
              placeholder="Street, area, landmark"
            />
          </Field>

          <Field label="Pickup location" required>
            <LocationPicker
              initialLat={latitude}
              initialLng={longitude}
              onChange={(lat, lng, suggestedAddress) => {
                setLatitude(lat)
                setLongitude(lng)
                if (suggestedAddress && !address.trim()) {
                  setAddress(suggestedAddress)
                }
              }}
            />
          </Field>

          {error ? <Alert tone="error">{error}</Alert> : null}
          {success ? <Alert tone="success">{success}</Alert> : null}

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={submitting}
              leftIcon={<Building2 className="h-4 w-4" />}
            >
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]">
        {label}
        {required ? (
          <span className="ml-0.5 text-[var(--color-danger)]">*</span>
        ) : null}
      </span>
      {children}
    </label>
  )
}
