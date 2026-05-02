import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Building2, LogOut, Utensils } from 'lucide-react'
import { signOut } from '../../../lib/auth-client'
import {
  createMyOrganizationFn,
  expectedOrgTypeForRole,
  listCitiesFn,
} from '../../../lib/org-server'
import { ROLE_LABELS } from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/onboarding/organization')({
  loader: async () => ({ cities: await listCitiesFn() }),
  component: OnboardingOrganization,
})

function OnboardingOrganization() {
  const router = useRouter()
  const { cities } = Route.useLoaderData()
  const { user } = Route.useRouteContext() as {
    user: {
      name?: string | null
      email?: string | null
      role?: string | null
    }
  }

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
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (cities.length > 0 && !cityId) setCityId(cities[0].id)
  }, [cities, cityId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createMyOrganizationFn({
        data: {
          name,
          description: description || undefined,
          phone: phone || undefined,
          address: address || undefined,
          cityId: cityId || null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
        },
      })
      router.invalidate()
      await router.navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="border-b border-orange-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-orange-600">
            <Utensils className="h-6 w-6" />
            <span className="text-lg font-semibold">FoodSetu</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-orange-600/10 p-2 text-orange-700">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Set up your organization</h1>
            <p className="text-sm text-gray-600">
              Welcome, {user.name ?? user.email}. Tell us about your{' '}
              <span className="font-medium text-gray-800">{roleLabel}</span> so an admin can verify it.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            Your organization will be reviewed by an admin. You can sign in and view your dashboard
            immediately, but you won&apos;t be able to {user.role === 'RESTAURANT' ? 'post listings' : 'claim food'} until it&apos;s verified.
          </div>

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
              <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200">
                {expectedType || '—'}
                <span className="ml-2 text-xs text-gray-500">(matches your account role)</span>
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
                  placeholder="+91 …"
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
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500 ring-1 ring-gray-200">
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

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Latitude">
                <input
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className={inputCls}
                  placeholder="12.9716"
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className={inputCls}
                  placeholder="77.5946"
                />
              </Field>
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit for verification'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500'

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
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  )
}
