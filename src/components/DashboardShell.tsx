import { Link, useRouter } from '@tanstack/react-router'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  LogOut,
  Menu,
  Utensils,
  X,
  XCircle,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { signOut } from '../lib/auth-client'
import {
  VERIFICATION_LABELS,
  type VerificationStatus,
} from '../lib/permissions'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { StatusBadge, type BadgeTone } from './ui/StatusBadge'

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

const VERIFICATION_TONE: Record<VerificationStatus, BadgeTone> = {
  PENDING: 'amber',
  VERIFIED: 'green',
  REJECTED: 'red',
  SUSPENDED: 'gray',
}

export function DashboardShell({
  title: _title,
  roleLabel,
  user,
  organization,
  children,
}: Props) {
  const router = useRouter()
  const [mobileMenu, setMobileMenu] = useState(false)

  async function handleSignOut() {
    await signOut()
    router.invalidate()
    await router.navigate({ to: '/login' })
  }

  const status = (organization?.verificationStatus ?? null) as
    | VerificationStatus
    | null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-orange-600"
          >
            <Utensils className="h-5 w-5" />
            <span className="text-base font-semibold sm:text-lg">FoodSetu</span>
          </Link>
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              title="View reports related to you"
            >
              <Flag className="h-4 w-4" />
              Reports
            </Link>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 leading-tight">
                {user.name ?? user.email}
              </div>
              <div className="text-xs text-gray-500 leading-tight">{roleLabel}</div>
            </div>
            {status ? (
              <StatusBadge
                tone={VERIFICATION_TONE[status]}
                icon={<StatusIcon status={status} />}
                size="sm"
              >
                {VERIFICATION_LABELS[status] ?? status}
              </StatusBadge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Sign out
            </Button>
          </div>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenu((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 sm:hidden"
          >
            {mobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {mobileMenu ? (
          <div className="border-t border-gray-200 bg-white px-4 py-3 sm:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-900">
                  {user.name ?? user.email}
                </div>
                <div className="text-xs text-gray-500">{roleLabel}</div>
              </div>
              {status ? (
                <StatusBadge
                  tone={VERIFICATION_TONE[status]}
                  icon={<StatusIcon status={status} />}
                  size="sm"
                >
                  {VERIFICATION_LABELS[status] ?? status}
                </StatusBadge>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Link
                to="/reports"
                onClick={() => setMobileMenu(false)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Flag className="h-4 w-4" />
                Reports
              </Link>
              <Button
                variant="outline"
                onClick={handleSignOut}
                leftIcon={<LogOut className="h-4 w-4" />}
                fullWidth
              >
                Sign out
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {organization?.name ? (
          <div className="mb-4 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{organization.name}</span>{' '}
            · {roleLabel}
          </div>
        ) : null}

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
      return <CheckCircle2 className="h-3 w-3" />
    case 'REJECTED':
      return <XCircle className="h-3 w-3" />
    case 'SUSPENDED':
      return <AlertTriangle className="h-3 w-3" />
    case 'PENDING':
    default:
      return <Clock className="h-3 w-3" />
  }
}

function VerificationBanner({ status }: { status: VerificationStatus }) {
  const config: Record<
    VerificationStatus,
    { tone: 'warning' | 'error' | 'info'; title: string; body: string }
  > = {
    PENDING: {
      tone: 'warning',
      title: 'Awaiting verification',
      body:
        "Your organization is waiting for an admin to review it. You can't post listings or claim food yet.",
    },
    REJECTED: {
      tone: 'error',
      title: 'Verification rejected',
      body:
        'An admin rejected your organization profile. Please contact support to resolve the issue.',
    },
    SUSPENDED: {
      tone: 'warning',
      title: 'Account suspended',
      body:
        'Your organization has been suspended. Contact support if you believe this is in error.',
    },
    VERIFIED: { tone: 'info', title: '', body: '' },
  }
  const c = config[status]
  return (
    <Alert tone={c.tone} title={c.title} className="mb-5">
      {c.body}
    </Alert>
  )
}
