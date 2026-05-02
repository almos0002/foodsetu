import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ChevronDown, LogIn } from 'lucide-react'
import { signIn } from '../lib/auth-client'
import { getServerSession } from '../lib/auth-server'
import { roleToDashboard, safeRedirectPath } from '../lib/permissions'
import { BowlMascot } from './index'

type LoginSearch = { redirect?: string }

const DEMO_ACCOUNTS: Array<{ label: string; email: string }> = [
  { label: 'Admin', email: 'admin@foodsetu.dev' },
  { label: 'Restaurant', email: 'verified-restaurant@foodsetu.dev' },
  { label: 'NGO', email: 'verified-ngo@foodsetu.dev' },
  { label: 'Animal rescue', email: 'verified-animal@foodsetu.dev' },
]

export const Route = createFileRoute('/login')({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const session = await getServerSession()
    if (session?.user) {
      const target =
        safeRedirectPath(search.redirect) ??
        roleToDashboard((session.user as { role?: string }).role)
      throw redirect({ to: target })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const search = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? 'Sign in failed')
        return
      }
      const role = (result.data?.user as { role?: string } | undefined)?.role
      const target = safeRedirectPath(search.redirect) ?? roleToDashboard(role)
      await router.navigate({ to: target })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail)
    setPassword('password123')
  }

  return (
    <div className="relative min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {/* Faint grid backdrop */}
      <div
        className="grid-bg pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-md px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas)] p-7 sm:p-9">
          <Link to="/" className="flex items-center gap-2.5">
            <BowlMascot className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight">
              FoodSetu
            </span>
          </Link>

          <h1 className="font-display mt-7 text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-ink-2)]">
            Sign in to keep food out of the bin.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Field
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete="current-password"
              minLength={8}
              required
            />

            {error ? (
              <div className="rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-danger-ink)]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-ink)] text-[14px] font-medium text-white transition-colors hover:bg-[var(--color-ink-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--color-line-strong)]"
            >
              <LogIn className="h-4 w-4" />
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas-2)]">
            <button
              type="button"
              onClick={() => setDemoOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-canvas-3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2"
              aria-expanded={demoOpen}
            >
              <span>Try a demo account</span>
              <ChevronDown
                className={`h-4 w-4 text-[var(--color-ink-3)] transition-transform ${demoOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {demoOpen ? (
              <div className="border-t border-[var(--color-line)] p-3">
                <p className="px-1 pb-2 text-xs text-[var(--color-ink-2)]">
                  Tap to fill. Password:{' '}
                  <code className="font-mono rounded bg-[var(--color-canvas)] px-1.5 py-0.5 text-[11px] tracking-wider">
                    password123
                  </code>
                </p>
                <div className="grid gap-1">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemo(acc.email)}
                      className="flex items-center justify-between gap-3 rounded-md border border-transparent bg-[var(--color-canvas)] px-3 py-2 text-left text-xs transition-colors hover:border-[var(--color-line-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)]"
                    >
                      <span className="font-medium text-[var(--color-ink)]">
                        {acc.label}
                      </span>
                      <span className="truncate text-[var(--color-ink-3)]">
                        {acc.email}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <p className="mt-7 text-center text-sm text-[var(--color-ink-2)]">
            New here?{' '}
            <Link
              to="/register"
              className="font-medium text-[var(--color-ink)] underline decoration-[var(--color-line-strong)] underline-offset-2 transition-colors hover:decoration-[var(--color-ink)]"
            >
              Sign up — it&rsquo;s free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-medium text-[var(--color-ink)]"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-canvas)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] transition-colors focus:border-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-canvas-3)]"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  )
}
