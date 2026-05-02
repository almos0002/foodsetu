import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Flag } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { listMyVisibleReportsFn } from '../../../lib/report-server'
import type { VisibleReport } from '../../../lib/report-server'
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_BADGE_TONES,
  REPORT_STATUS_LABELS,
  ROLE_LABELS,
  roleToDashboard,
} from '../../../lib/permissions'
import type { Role } from '../../../lib/permissions'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import type { BadgeTone } from '../../../components/ui/StatusBadge'
import { fullDateTime } from '../../../lib/time'

const VISIBILITY_LABEL: Record<VisibleReport['visibility'], string> = {
  FILED_BY_ME: 'Filed by you',
  ABOUT_MY_LISTING: 'About your listing',
  ABOUT_MY_CLAIM: 'About your claim',
}

const VISIBILITY_TONE: Record<VisibleReport['visibility'], BadgeTone> = {
  FILED_BY_ME: 'blue',
  ABOUT_MY_LISTING: 'red',
  ABOUT_MY_CLAIM: 'purple',
}

export const Route = createFileRoute('/_authed/reports/')({
  head: () => ({ meta: [{ title: 'Reports | FoodSetu' }] }),
  loader: async () => ({
    reports: await listMyVisibleReportsFn().catch((): VisibleReport[] => []),
  }),
  component: MyReportsPage,
})

function MyReportsPage() {
  const { reports } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext()

  const isAdmin = user.role === 'ADMIN'
  const roleLabel = (user.role && ROLE_LABELS[user.role as Role]) ?? 'Member'
  const dashboardPath = roleToDashboard(user.role)

  return (
    <DashboardShell
      title="Reports"
      roleLabel={roleLabel}
      user={user}
      organization={organization}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link
          to={dashboardPath as '/admin/dashboard'}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        {isAdmin ? (
          <Link to="/admin/reports">
            <Button size="sm" leftIcon={<Flag className="h-4 w-4" />}>
              Open admin queue
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="mb-6">
        <div className="tiny-cap text-[var(--color-coral)]">Reports</div>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          What admins are looking into
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-2)]">
          Reports you&apos;ve filed, plus reports about your listings or claims
          so you always know what an admin is reviewing.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-cream)]">
          <EmptyState
            bare
            icon={Flag}
            title="No reports to show"
            description="If something went wrong with a pickup or a listing, file a report from the relevant card."
          />
        </div>
      ) : (
        <ul className="grid gap-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-[24px] border border-[var(--color-line)] bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-bold text-[var(--color-ink)]">
                      {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                    <StatusBadge
                      tone={VISIBILITY_TONE[r.visibility]}
                      size="sm"
                    >
                      {VISIBILITY_LABEL[r.visibility]}
                    </StatusBadge>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-ink-3)]">
                    {r.listingTitle ? (
                      <>
                        Listing · {r.listingTitle}
                        {r.listingStatus ? ` (${r.listingStatus})` : ''}
                      </>
                    ) : (
                      <span className="italic">No linked listing</span>
                    )}
                    {' · filed '}
                    {fullDateTime(r.createdAt)}
                  </div>
                </div>
                <StatusBadge tone={REPORT_STATUS_BADGE_TONES[r.status]}>
                  {REPORT_STATUS_LABELS[r.status]}
                </StatusBadge>
              </div>
              {r.description ? (
                <p className="mt-3 whitespace-pre-line text-sm text-[var(--color-ink-2)]">
                  {r.description}
                </p>
              ) : null}
              {r.visibility !== 'FILED_BY_ME' ? (
                <div className="mt-2 text-[11px] text-[var(--color-ink-3)]">
                  Reporter: {r.reporterName ?? 'Unknown'}
                  {r.reporterOrgName ? ` (${r.reporterOrgName})` : ''}
                </div>
              ) : null}
              {r.resolvedAt ? (
                <div className="mt-1.5 text-[11px] font-semibold text-[var(--color-mint-ink)]">
                  Closed {fullDateTime(r.resolvedAt)}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}
