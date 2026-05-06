import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Flag } from 'lucide-react'
import { DashboardShell } from '../../../components/DashboardShell'
import type { OrganizationRow } from '../../../lib/org-server'
import {
  listMyVisibleReportsFn,
  type VisibleReport,
} from '../../../lib/report-server'
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_BADGE_TONES,
  REPORT_STATUS_LABELS,
  ROLE_LABELS,
  roleToDashboard,
  type Role,
} from '../../../lib/permissions'
import { StatusBadge } from '../../../components/ui/StatusBadge'

const VISIBILITY_LABEL: Record<VisibleReport['visibility'], string> = {
  FILED_BY_ME: 'Filed by you',
  ABOUT_MY_LISTING: 'About your listing',
  ABOUT_MY_CLAIM: 'About your claim',
}

const VISIBILITY_BADGE: Record<VisibleReport['visibility'], string> = {
  FILED_BY_ME: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  ABOUT_MY_LISTING: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
  ABOUT_MY_CLAIM: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
}

export const Route = createFileRoute('/_authed/reports/')({
  loader: async () => ({
    reports: await listMyVisibleReportsFn().catch(
      (): VisibleReport[] => [],
    ),
  }),
  component: MyReportsPage,
})

function MyReportsPage() {
  const { reports } = Route.useLoaderData()
  const { user, organization } = Route.useRouteContext() as {
    user: { name?: string | null; email?: string | null; role?: string | null }
    organization: OrganizationRow | null
  }

  // Admin gets a one-line shortcut to /admin/reports because that view is
  // the source of truth for them; the rest of the page still works.
  const isAdmin = user.role === 'ADMIN'
  const roleLabel =
    (user.role && ROLE_LABELS[user.role as Role]) ?? 'Member'
  const dashboardPath = roleToDashboard(user.role)

  return (
    <DashboardShell
      title="Reports"
      roleLabel={roleLabel}
      user={user}
      organization={organization}
    >
      <div className="mb-4 flex items-center justify-between">
        <Link
          to={dashboardPath as '/admin/dashboard'}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        {isAdmin ? (
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1.5 squircle bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            <Flag className="h-4 w-4" />
            Open admin queue
          </Link>
        ) : null}
      </div>

      <p className="mb-4 text-sm text-gray-600">
        Reports you&apos;ve filed, plus reports about your listings or
        claims so you know what an admin is looking into.
      </p>

      {reports.length === 0 ? (
        <div className="squircle border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
          No reports to show. If something went wrong with a pickup or a
          listing, file a report from the relevant card.
        </div>
      ) : (
        <ul className="grid gap-3">
          {reports.map((r) => (
            <li
              key={r.id}
              className="squircle border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {REPORT_REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                    <span
                      className={`squircle px-2 py-0.5 text-[10px] font-medium ${VISIBILITY_BADGE[r.visibility]}`}
                    >
                      {VISIBILITY_LABEL[r.visibility]}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {r.listingTitle ? (
                      <>
                        Listing · {r.listingTitle}
                        {r.listingStatus ? ` (${r.listingStatus})` : ''}
                      </>
                    ) : (
                      <span className="italic">No linked listing</span>
                    )}
                    {' · filed '}
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <StatusBadge tone={REPORT_STATUS_BADGE_TONES[r.status]}>
                  {REPORT_STATUS_LABELS[r.status]}
                </StatusBadge>
              </div>
              {r.description ? (
                <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                  {r.description}
                </p>
              ) : null}
              {r.visibility !== 'FILED_BY_ME' ? (
                <div className="mt-2 text-[11px] text-gray-500">
                  Reporter: {r.reporterName ?? 'Unknown'}
                  {r.reporterOrgName ? ` (${r.reporterOrgName})` : ''}
                </div>
              ) : null}
              {r.resolvedAt ? (
                <div className="mt-1 text-[11px] text-emerald-700">
                  Closed {new Date(r.resolvedAt).toLocaleString()}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  )
}
