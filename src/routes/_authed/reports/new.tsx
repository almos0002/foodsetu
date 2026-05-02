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
import { createReportFn } from '../../../lib/report-server'
import {
  REPORT_REASONS,
  REPORT_REASON_HINTS,
  REPORT_REASON_LABELS,
  ROLE_LABELS,
  isValidReportReason,
} from '../../../lib/permissions'
import type { ReportReason, Role } from '../../../lib/permissions'

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
  const { user, organization } = Route.useRouteContext()

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

  const roleLabel = (user.role && ROLE_LABELS[user.role as Role]) ?? 'Member'

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
            An admin will review it shortly. You can track its status on your
            reports page.
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
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-[28px] border-[1.5px] border-[var(--color-line)] bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 -rotate-3 flex-shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-[var(--color-line-strong)] bg-[var(--color-coral)] text-white">
              <Flag className="h-4 w-4" />
            </div>
            <div>
              <div className="tiny-cap text-[var(--color-coral)]">
                File a report
              </div>
              <h2 className="font-display mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                Tell us what went wrong
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-2)]">
                Reports are reviewed by FoodSetu admins. Please be specific so
                they can act quickly.
              </p>
            </div>
          </div>

          {search.listingId || search.claimId ? (
            <div className="mt-5 rounded-2xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-3 text-xs text-[var(--color-ink-2)]">
              <div className="tiny-cap text-[var(--color-ink-3)]">
                Linked context
              </div>
              <div className="mt-2 space-y-0.5 font-mono text-[11px] text-[var(--color-ink)]">
                {search.listingId ? (
                  <div>Listing · {search.listingId}</div>
                ) : null}
                {search.claimId ? <div>Claim · {search.claimId}</div> : null}
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold text-[var(--color-ink)]">
                Reason
              </legend>
              <div className="mt-3 space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border-[1.5px] px-4 py-3 transition-colors ${
                      reason === r
                        ? 'border-[var(--color-coral)] bg-[var(--color-coral-soft)]'
                        : 'border-[var(--color-line)] bg-white hover:border-[var(--color-line-strong)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="mt-0.5 h-4 w-4 accent-[var(--color-coral)]"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[var(--color-ink)]">
                        {REPORT_REASON_LABELS[r]}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--color-ink-2)]">
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
                className="block text-sm font-semibold text-[var(--color-ink)]"
              >
                Description{' '}
                <span className="font-normal text-[var(--color-ink-3)]">
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
                className="mt-1.5 w-full rounded-2xl border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-[var(--color-ink)] focus:outline-none"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--color-ink-3)]">
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
