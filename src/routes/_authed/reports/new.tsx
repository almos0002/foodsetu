import {
  Link,
  createFileRoute,
  useRouter,
  useSearch,
} from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Flag } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import type { OrganizationRow } from '../../../lib/org-server'
import { createReportFn } from '../../../lib/report-server'
import {
  REPORT_REASONS,
  REPORT_REASON_HINTS,
  REPORT_REASON_LABELS,
  ROLE_LABELS,
  isValidReportReason,
  type ReportReason,
  type Role,
} from '../../../lib/permissions'

type SearchSchema = {
  listingId?: string
  claimId?: string
  reason?: string
}

export const Route = createFileRoute('/_authed/reports/new')({
  validateSearch: (raw: Record<string, unknown>): SearchSchema => {
    const out: SearchSchema = {}
    if (typeof raw.listingId === 'string' && raw.listingId) {
      out.listingId = raw.listingId
    }
    if (typeof raw.claimId === 'string' && raw.claimId) {
      out.claimId = raw.claimId
    }
    if (typeof raw.reason === 'string' && isValidReportReason(raw.reason)) {
      out.reason = raw.reason
    }
    return out
  },
  component: NewReportPage,
})

function NewReportPage() {
  const router = useRouter()
  const search = useSearch({ from: '/_authed/reports/new' })
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }

  const [reason, setReason] = useState<ReportReason>(
    (search.reason as ReportReason) ?? 'SPOILED',
  )
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await createReportFn({
        data: {
          reason,
          description: description.trim() ? description.trim() : null,
          foodListingId: search.listingId ?? null,
          claimId: search.claimId ?? null,
        },
      })
      setSubmittedId(res.id)
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to file report')
    } finally {
      setBusy(false)
    }
  }

  const roleLabel =
    (user.role && ROLE_LABELS[user.role as Role]) ?? 'Member'

  if (submittedId) {
    return (
      <DashboardShell
        title="Report filed"
        roleLabel={roleLabel}
        user={user}
        organization={organization}
      >
        <div className="mx-auto max-w-2xl">
          <Alert
            tone="success"
            title={
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Thanks — your report was filed
              </span>
            }
          >
            An admin will review it shortly. You can track its status on
            your reports page.
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/reports">
                <Button size="sm">View my reports</Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSubmittedId(null)
                  setDescription('')
                }}
              >
                File another report
              </Button>
            </div>
          </Alert>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="File a report"
      roleLabel={roleLabel}
      user={user}
      organization={organization}
    >
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-lg border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Flag className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Tell us what went wrong
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Reports are reviewed by FoodSetu admins. Please be specific
                so they can act quickly.
              </p>
            </div>
          </div>

          {search.listingId || search.claimId ? (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <div className="font-medium uppercase tracking-wide text-gray-500">
                Linked context
              </div>
              <div className="mt-1 space-y-0.5 font-mono text-[11px] text-gray-700">
                {search.listingId ? (
                  <div>Listing · {search.listingId}</div>
                ) : null}
                {search.claimId ? <div>Claim · {search.claimId}</div> : null}
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold text-gray-900">
                Reason
              </legend>
              <div className="mt-2 space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors ${
                      reason === r
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="mt-0.5 h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {REPORT_REASON_LABELS[r]}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        {REPORT_REASON_HINTS[r]}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-900"
              >
                Description{' '}
                <span className="font-normal text-gray-500">
                  ({reason === 'OTHER' ? 'required' : 'optional'})
                </span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                maxLength={2000}
                placeholder="Add any details that will help an admin investigate."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                <span>{description.length} / 2000</span>
              </div>
            </div>

            {error ? <Alert tone="error">{error}</Alert> : null}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.history.back()}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={busy}
                leftIcon={<Flag className="h-4 w-4" />}
              >
                {busy ? 'Filing…' : 'File report'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardShell>
  )
}
