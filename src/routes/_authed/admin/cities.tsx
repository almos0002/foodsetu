import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { LocationPicker } from '../../../components/map/LocationPicker'
import { AdminTable } from '../../../components/admin/AdminTable'
import type { Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { PageHeader } from '../../../components/ui/PageHeader'
import {
  createCityFn,
  listCitiesForAdminFn,
  toggleCityActiveFn,
  updateCityFn,
} from '../../../lib/admin-server'
import type { AdminCityRow } from '../../../lib/admin-server'
import { canAccessAdmin, roleToDashboard } from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/cities')({
  head: () => ({ meta: [{ title: 'Cities · Admin | FoodSetu' }] }),
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) })
    }
  },
  loader: async () => ({ cities: await listCitiesForAdminFn() }),
  component: AdminCities,
})

type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'

type FormState = {
  id: string | null
  name: string
  state: string
  country: string
  latitude: string
  longitude: string
  isActive: boolean
}

const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  state: '',
  country: 'NP',
  latitude: '',
  longitude: '',
  isActive: true,
}

const INPUT_CLS =
  'mt-1 block w-full squircle border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20'

function AdminCities() {
  const router = useRouter()
  const { cities } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const [filter, setFilter] = useState<ActiveFilter>('ALL')
  const [form, setForm] = useState<FormState | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyToggleId, setBusyToggleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filtered =
    filter === 'ALL'
      ? cities
      : cities.filter((c) => (filter === 'ACTIVE' ? c.isActive : !c.isActive))

  const filters = [
    { value: 'ALL' as ActiveFilter, label: 'All', count: cities.length },
    {
      value: 'ACTIVE' as ActiveFilter,
      label: 'Active',
      count: cities.filter((c) => c.isActive).length,
    },
    {
      value: 'INACTIVE' as ActiveFilter,
      label: 'Inactive',
      count: cities.filter((c) => !c.isActive).length,
    },
  ]

  function startCreate() {
    setError(null)
    setSuccess(null)
    setForm({ ...EMPTY_FORM })
  }

  function startEdit(c: AdminCityRow) {
    setError(null)
    setSuccess(null)
    setForm({
      id: c.id,
      name: c.name,
      state: c.state,
      country: c.country,
      latitude: c.latitude == null ? '' : String(c.latitude),
      longitude: c.longitude == null ? '' : String(c.longitude),
      isActive: c.isActive,
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form) return
    setError(null)
    setBusy(true)
    try {
      const payload = {
        name: form.name,
        state: form.state,
        country: form.country,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        isActive: form.isActive,
      }
      if (form.id) {
        await updateCityFn({ data: { ...payload, id: form.id } })
        setSuccess(`Updated ${form.name}.`)
      } else {
        await createCityFn({ data: payload })
        setSuccess(`Added ${form.name}.`)
      }
      setForm(null)
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save city')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggle(c: AdminCityRow) {
    setError(null)
    setSuccess(null)
    setBusyToggleId(c.id)
    try {
      await toggleCityActiveFn({
        data: { id: c.id, isActive: !c.isActive },
      })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update city')
    } finally {
      setBusyToggleId(null)
    }
  }

  const columns: Column<AdminCityRow>[] = [
    {
      key: 'city',
      header: 'City',
      render: (c) => (
        <div>
          <div className="font-medium text-gray-900">{c.name}</div>
          <div className="text-xs text-gray-500">
            {c.state} · {c.country}
          </div>
        </div>
      ),
    },
    {
      key: 'coords',
      header: 'Coordinates',
      render: (c) =>
        c.latitude && c.longitude ? (
          <span className="font-mono text-xs tabular-nums text-gray-600">
            {Number(c.latitude).toFixed(4)}, {Number(c.longitude).toFixed(4)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <StatusPill
          label={c.isActive ? 'Active' : 'Inactive'}
          tone={c.isActive ? 'green' : 'gray'}
        />
      ),
    },
    {
      key: 'created',
      header: 'Added',
      render: (c) => (
        <span className="text-xs tabular-nums text-gray-500">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => startEdit(c)}
            leftIcon={<Pencil className="h-3.5 w-3.5" />}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={c.isActive ? 'outline' : 'outline'}
            onClick={() => handleToggle(c)}
            disabled={busyToggleId === c.id}
            className={
              c.isActive
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }
          >
            {busyToggleId === c.id
              ? 'Saving…'
              : c.isActive
                ? 'Disable'
                : 'Enable'}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AdminShell title="Cities" user={user}>
      <PageHeader
        eyebrow="Operations"
        title="Cities"
        description="Cities listed here power the city dropdown shown to restaurants and claimants. Disabling a city hides it from new sign-ups but keeps existing references intact."
        actions={
          <Button onClick={startCreate} leftIcon={<Plus className="h-4 w-4" />}>
            New city
          </Button>
        }
      />

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert tone="success" className="mb-4">
          {success}
        </Alert>
      ) : null}

      {form ? (
        <form
          onSubmit={handleSubmit}
          className="mb-6 squircle border border-gray-200 bg-white p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {form.id ? 'Edit city' : 'New city'}
            </h3>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="squircle p-1 text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={120}
                className={INPUT_CLS}
              />
            </Field>
            <Field label="State / region" required>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                maxLength={120}
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Country code">
              <input
                type="text"
                value={form.country}
                onChange={(e) =>
                  setForm({
                    ...form,
                    country: e.target.value.slice(0, 2).toUpperCase(),
                  })
                }
                maxLength={2}
                placeholder="IN"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="Active in dropdowns">
              <label className="mt-1 inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="squircle border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                Visible to users
              </label>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="City center on map">
              <p className="mb-2 text-xs text-gray-500">
                Search a place or drop the pin to set the city's coordinates.
                These power distance calculations for nearby food.
              </p>
              <LocationPicker
                initialLat={form.latitude === '' ? null : Number(form.latitude)}
                initialLng={
                  form.longitude === '' ? null : Number(form.longitude)
                }
                onChange={(lat, lng) =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          latitude: lat.toFixed(7),
                          longitude: lng.toFixed(7),
                        }
                      : prev,
                  )
                }
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : form.id ? 'Save changes' : 'Add city'}
            </Button>
          </div>
        </form>
      ) : null}

      <AdminTable
        rows={filtered}
        columns={columns}
        rowKey={(c) => c.id}
        searchPlaceholder="Search by city, state…"
        searchKeys={['name', 'state']}
        filters={filters}
        filterValue={filter}
        onFilterChange={setFilter}
        emptyLabel="No cities yet — add one to enable city-based discovery."
      />
    </AdminShell>
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
      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  )
}
