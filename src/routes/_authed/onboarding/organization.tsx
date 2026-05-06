import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Building2, LogOut } from 'lucide-react'
import { signOut } from '../../../lib/auth-client'
import { LocationPicker } from '../../../components/map/LocationPicker'
import {
  createMyOrganizationFn,
  expectedOrgTypeForRole,
  listCitiesFn,
} from '../../../lib/org-server'
import { ROLE_LABELS } from '../../../lib/permissions'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'

export const Route = createFileRoute('/_authed/onboarding/organization')({
  head: () => ({ meta: [{ title: 'Set up your organization | FoodSetu' }] }),
  loader: async () => ({ cities: await listCitiesFn() }),
  component: OnboardingOrganization,
})

function OnboardingOrganization() {
  const router = useRouter()
  const { cities } = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  const expectedType = expectedOrgTypeForRole(user.role) ?? ''
  const roleLabel =
    user.role && user.role in ROLE_LABELS
      ? ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]
      : 'Member'

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [cityId, setCityId] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (cities.length > 0 && !cityId) setCityId(cities[0].id)
  }, [cities, cityId])

  function isInNepalBounds(lat: number, lng: number): boolean {
    return lat >= 26 && lat <= 31 && lng >= 80 && lng <= 89
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (latitude == null || longitude == null) {
      setError('Please pick your location on the map')
      return
    }
    if (!isInNepalBounds(latitude, longitude)) {
      setError('Please pick a location inside Nepal on the map')
      return
    }
    setSubmitting(true)
    try {
      await createMyOrganizationFn({
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
      router.invalidate()
      await router.navigate({ to: '/' })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create organization',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <header className="border-b-[1.5px] border-[var(--color-line)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-lg font-bold tracking-tight text-[var(--color-ink)]">
              FoodSetu
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center squircle border border-[var(--color-line-strong)] bg-[var(--color-coral)] text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="tiny-cap text-[var(--color-coral)]">
              Almost there
            </div>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
              Set up your organization
            </h1>
            <p className="mt-2 text-sm text-[var(--color-ink-2)] sm:text-base">
              Welcome, {user.name ?? user.email}. Tell us about your{' '}
              <span className="font-semibold text-[var(--color-ink)]">
                {roleLabel}
              </span>{' '}
              so an admin can verify it.
            </p>
          </div>
        </div>

        <div className="squircle border border-[var(--color-line)] bg-white p-6 sm:p-8">
          <Alert tone="warning" className="mb-6">
            Your organization will be reviewed by an admin. You can sign in and
            view your dashboard immediately, but you won&apos;t be able to{' '}
            {user.role === 'RESTAURANT' ? 'post listings' : 'claim food'} until
            it&apos;s verified.
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Organization name" required>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className={inputCls}
                placeholder="e.g. Annapurna Community Kitchen"
              />
            </Field>

            <Field label="Type">
              <div className="squircle border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 text-sm text-[var(--color-ink)]">
                {expectedType || '—'}
                <span className="ml-2 text-xs text-[var(--color-ink-3)]">
                  (matches your account role)
                </span>
              </div>
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                className={inputCls}
                placeholder="Brief mission, areas served, capacity, etc."
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
                  <div className="squircle border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 text-sm text-[var(--color-ink-3)]">
                    No cities seeded yet — leave blank for now.
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

            <Button type="submit" disabled={submitting} size="lg" fullWidth>
              {submitting ? 'Submitting…' : 'Submit for verification'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

const inputCls =
  'w-full squircle border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-ink)] focus:outline-none'

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
      <span className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
        {label}
        {required ? (
          <span className="ml-0.5 text-[var(--color-coral)]">*</span>
        ) : null}
      </span>
      {children}
    </label>
  )
}

function BrandMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center squircle border border-[var(--color-line-strong)] bg-[var(--color-coral)]">
      <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden>
        <path
          d="M5 16 Q 5 24 16 25 Q 27 24 27 16 Z"
          fill="white"
          stroke="#1a1f2e"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="13" cy="19" r="1.4" fill="#1a1f2e" />
        <circle cx="19" cy="19" r="1.4" fill="#1a1f2e" />
        <path
          d="M14 22 Q 16 23.5 18 22"
          fill="none"
          stroke="#1a1f2e"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
