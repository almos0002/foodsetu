import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, ChevronDown, LogIn, Sparkles, Utensils } from 'lucide-react'
import { signIn } from '../lib/auth-client'
import { getServerSession } from '../lib/auth-server'
import { roleToDashboard, safeRedirectPath } from '../lib/permissions'

type LoginSearch = { redirect?: string }

const HERO_IMG =
  'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1400&auto=format&fit=crop&q=80'

const DEMO_ACCOUNTS: Array<{ label: string; email: string }> = [
  { label: 'Admin', email: 'admin@foodsetu.dev' },
  { label: 'Restaurant (verified)', email: 'verified-restaurant@foodsetu.dev' },
  { label: 'NGO (verified)', email: 'verified-ngo@foodsetu.dev' },
  { label: 'Animal rescue (verified)', email: 'verified-animal@foodsetu.dev' },
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
    <div className="min-h-screen bg-white text-gray-900 lg:grid lg:grid-cols-2">
      {/* Form column */}
      <div className="flex min-h-screen flex-col px-6 py-10 sm:px-10 lg:min-h-0 lg:px-14 lg:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <div className="mt-10 flex flex-1 flex-col items-stretch lg:mt-12">
          <div className="mx-auto w-full max-w-sm">
            <Link to="/" className="flex items-center gap-2 text-orange-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
                <Utensils className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                FoodSetu
              </span>
            </Link>

            <h1 className="mt-10 text-3xl font-semibold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to continue redistributing surplus food.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  placeholder="At least 8 characters"
                  autoComplete="current-password"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-semibold text-white transition-colors hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {/* Demo accounts dropdown */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setDemoOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                aria-expanded={demoOpen}
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-600" />
                  Try a demo account
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform ${demoOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {demoOpen ? (
                <div className="border-t border-gray-200 p-3">
                  <p className="px-1 pb-2 text-xs text-gray-500">
                    Tap to fill the form. Password for all demos:{' '}
                    <code className="rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                      password123
                    </code>
                  </p>
                  <div className="grid gap-1.5">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => fillDemo(acc.email)}
                        className="flex items-center justify-between gap-3 rounded-lg border border-transparent bg-white px-3 py-2 text-left text-xs hover:border-orange-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        <span className="font-medium text-gray-900">
                          {acc.label}
                        </span>
                        <span className="truncate text-gray-500">
                          {acc.email}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              New here?{' '}
              <Link
                to="/register"
                className="font-semibold text-orange-600 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Photo column */}
      <div className="relative hidden lg:block">
        <img
          src={HERO_IMG}
          alt="A community kitchen at work"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            Built for kitchens & community
          </div>
          <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight text-white">
            Every meal you sign in for is one less meal in the bin.
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/85">
            Restaurants, NGOs and animal rescues coordinate every pickup with a
            full audit trail.
          </p>
        </div>
      </div>
    </div>
  )
}
