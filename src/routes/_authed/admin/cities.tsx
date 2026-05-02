import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { AdminShell } from '../../../components/admin/AdminShell'
import { AdminTable, type Column } from '../../../components/admin/AdminTable'
import { StatusPill } from '../../../components/admin/StatusPill'
import {
  createCityFn,
  listCitiesForAdminFn,
  toggleCityActiveFn,
  updateCityFn,
  type AdminCityRow,
} from '../../../lib/admin-server'
import { canAccessAdmin, roleToDashboard } from '../../../lib/permissions'

export const Route = createFileRoute('/_authed/admin/cities')({
  beforeLoad: ({ context }) => {
    const user = (context as { user: { role?: string } }).user
    if (!canAccessAdmin(user)) {
      throw redirect({ to: roleToDashboard(user.role) as string })
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
  country: 'IN',
  latitude: '',
  longitude: '',
  isActive: true,
}

function AdminCities() {
  const router = useRouter()
  const { cities } = Route.useLoaderData()
  const { user } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
  }
  const [filter, setFilter] = useState<ActiveFilter>('ALL')
  const [form, setForm] = useState<FormState | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyToggleId, setBusyToggleId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filtered =
    filter === 'ALL'
      ? cities
      : cities.filter((c) =>
          filter === 'ACTIVE' ? c.isActive : !c.isActive,
        )

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
          <span className="font-mono text-xs text-gray-600">
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
          className={
            c.isActive
              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
              : 'bg-gray-200 text-gray-700 ring-1 ring-gray-300'
          }
        />
      ),
    },
    {
      key: 'created',
      header: 'Added',
      render: (c) => (
        <span className="text-xs text-gray-500">
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
          <button
            type="button"
            onClick={() => startEdit(c)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleToggle(c)}
            disabled={busyToggleId === c.id}
            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-40 ${
              c.isActive
                ? 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'
                : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {busyToggleId === c.id
              ? 'Saving…'
              : c.isActive
                ? 'Disable'
                : 'Enable'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminShell title="Cities" user={user}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Cities listed here power the city dropdown shown to restaurants and
          claimants. Disabling a city hides it from new sign-ups but keeps
          existing references intact.
        </p>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          <Plus className="h-4 w-4" />
          New city
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {success}
        </div>
      ) : null}

      {form ? (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              {form.id ? 'Edit city' : 'New city'}
            </h3>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
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
                className="input"
              />
            </Field>
            <Field label="State / region" required>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                maxLength={120}
                className="input"
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
                className="input"
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
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                Visible to users
              </label>
            </Field>
            <Field label="Latitude">
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) =>
                  setForm({ ...form, latitude: e.target.value })
                }
                min={-90}
                max={90}
                placeholder="e.g. 19.0760"
                className="input"
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  setForm({ ...form, longitude: e.target.value })
                }
                min={-180}
                max={180}
                placeholder="e.g. 72.8777"
                className="input"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:bg-gray-300"
            >
              {busy ? 'Saving…' : form.id ? 'Save changes' : 'Add city'}
            </button>
          </div>
          <style>{`.input { margin-top: 0.25rem; width: 100%; border-radius: 0.5rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #111827; } .input:focus { outline: none; border-color: #F97316; box-shadow: 0 0 0 2px rgba(254, 215, 170, 0.6); }`}</style>
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
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  )
}
