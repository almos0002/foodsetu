import { Link, useRouter } from '@tanstack/react-router'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  LogOut,
  XCircle,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { signOut } from '../lib/auth-client'
import { BowlMascot } from '../routes/index'
import {
  VERIFICATION_BADGE_CLASSES,
  VERIFICATION_LABELS,
  type VerificationStatus,
} from '../lib/permissions'

type Org = {
  name?: string | null
  verificationStatus?: string | null
} | null

type Props = {
  title: string
  roleLabel: string
  user: { name?: string | null; email?: string | null }
  organization?: Org
  children: ReactNode
}

export function DashboardShell({
  title,
  roleLabel,
  user,
  organization,
  children,
}: Props) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.invalidate()
    await router.navigate({ to: '/login' })
  }

  const status = (organization?.verificationStatus ?? null) as VerificationStatus | null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <BowlMascot className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
              FoodSetu
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/reports"
              className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 sm:inline-flex"
              title="View reports related to you"
            >
              <Flag className="h-4 w-4" />
              Reports
            </Link>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-gray-900">
                {user.name ?? user.email}
              </div>
              <div className="text-xs text-gray-500">{roleLabel}</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">
              {organization?.name ? (
                <>
                  <span className="font-medium text-gray-800">{organization.name}</span>{' '}
                  · {roleLabel}
                </>
              ) : (
                <>{roleLabel} workspace</>
              )}
            </p>
          </div>
          {status ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                VERIFICATION_BADGE_CLASSES[status] ?? ''
              }`}
            >
              <StatusIcon status={status} />
              {VERIFICATION_LABELS[status] ?? status}
            </span>
          ) : null}
        </div>

        {status && status !== 'VERIFIED' ? (
          <VerificationBanner status={status} />
        ) : null}

        {children}
      </main>
    </div>
  )
}

function StatusIcon({ status }: { status: VerificationStatus }) {
  switch (status) {
    case 'VERIFIED':
      return <CheckCircle2 className="h-3.5 w-3.5" />
    case 'REJECTED':
      return <XCircle className="h-3.5 w-3.5" />
    case 'SUSPENDED':
      return <AlertTriangle className="h-3.5 w-3.5" />
    case 'PENDING':
    default:
      return <Clock className="h-3.5 w-3.5" />
  }
}

function VerificationBanner({ status }: { status: VerificationStatus }) {
  const config: Record<
    VerificationStatus,
    { wrapper: string; title: string; body: string }
  > = {
    PENDING: {
      wrapper: 'bg-amber-50 ring-amber-200 text-amber-900',
      title: 'Awaiting verification',
      body:
        "Your organization is waiting for an admin to review it. You can't post listings or claim food yet.",
    },
    REJECTED: {
      wrapper: 'bg-red-50 ring-red-200 text-red-900',
      title: 'Verification rejected',
      body:
        'An admin rejected your organization profile. Please contact support to resolve the issue.',
    },
    SUSPENDED: {
      wrapper: 'bg-gray-100 ring-gray-300 text-gray-800',
      title: 'Account suspended',
      body: 'Your organization has been suspended. Contact support if you believe this is in error.',
    },
    VERIFIED: { wrapper: '', title: '', body: '' },
  }
  const c = config[status]
  return (
    <div className={`mb-6 rounded-xl px-4 py-3 text-sm ring-1 ${c.wrapper}`}>
      <div className="font-semibold">{c.title}</div>
      <div className="mt-0.5">{c.body}</div>
    </div>
  )
}
