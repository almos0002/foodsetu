import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ChevronDown, LogIn, Sparkles } from 'lucide-react'
import { signIn } from '../lib/auth-client'
import { getServerSession } from '../lib/auth-server'
import { roleToDashboard, safeRedirectPath } from '../lib/permissions'
import { BowlMascot } from './index'

type LoginSearch = { redirect?: string }

const DEMO_ACCOUNTS: Array<{ label: string; email: string; tone: string }> = [
  { label: 'Admin', email: 'admin@foodsetu.dev', tone: 'berry' },
  {
    label: 'Restaurant',
    email: 'verified-restaurant@foodsetu.dev',
    tone: 'coral',
  },
  { label: 'NGO', email: 'verified-ngo@foodsetu.dev', tone: 'mint' },
  { label: 'Animal rescue', email: 'verified-animal@foodsetu.dev', tone: 'sun' },
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

function toneFor(tone: string) {
  if (tone === 'coral')
    return 'bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)]'
  if (tone === 'mint')
    return 'bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)]'
  if (tone === 'sun')
    return 'bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)]'
  return 'bg-[var(--color-berry-soft)] text-[var(--color-berry-ink)]'
}

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
    <div className="dotgrid relative min-h-screen bg-[var(--color-cream)] px-5 py-8 sm:px-8 sm:py-12">
      {/* corner mascot — playful peek */}
      <div className="pointer-events-none absolute right-4 top-4 hidden sm:block">
        <BowlMascot className="h-16 w-16" smiling />
      </div>

      <Link
        to="/"
        className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-2)] hover:text-[var(--color-coral)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="relative mx-auto mt-8 max-w-md">
        <div className="rounded-[32px] border-[1.5px] border-[var(--color-line-strong)] bg-white p-7 sm:p-10">
          <Link to="/" className="flex items-center gap-2.5">
            <BowlMascot className="h-10 w-10" smiling />
            <span className="font-display text-2xl font-bold tracking-tight">
              FoodSetu
            </span>
          </Link>

          <h1 className="font-display mt-8 text-4xl font-bold tracking-tight">
            Welcome back
            <span className="text-[var(--color-coral)]">.</span>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-2)]">
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
              <div className="rounded-2xl border-[1.5px] border-[var(--color-coral)] bg-[var(--color-coral-soft)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-coral-ink)]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-coral)] text-sm font-semibold text-white transition-all hover:bg-[var(--color-coral-2)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <LogIn className="h-4 w-4" />
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border-[1.5px] border-dashed border-[var(--color-line-strong)] bg-[var(--color-cream)]">
            <button
              type="button"
              onClick={() => setDemoOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-cream-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:ring-offset-2"
              aria-expanded={demoOpen}
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--color-coral)]" />
                Try a demo account
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${demoOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {demoOpen ? (
              <div className="border-t-[1.5px] border-dashed border-[var(--color-line-strong)] p-3">
                <p className="px-1 pb-2 text-xs text-[var(--color-ink-2)]">
                  Tap to fill. Password:{' '}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[11px] font-bold tracking-wider">
                    password123
                  </code>
                </p>
                <div className="grid gap-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemo(acc.email)}
                      className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-transparent bg-white px-3 py-2 text-left text-xs hover:border-[var(--color-line-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
                    >
                      <span
                        className={`chip ${toneFor(acc.tone)}`}
                      >
                        {acc.label}
                      </span>
                      <span className="truncate text-[var(--color-ink-2)]">
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
              className="font-bold text-[var(--color-coral)] hover:underline"
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
        className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]"
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
        className="w-full rounded-2xl border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-sm placeholder-[var(--color-ink-3)] transition-colors focus:border-[var(--color-ink)] focus:outline-none"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  )
}
