import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowLeft,
  Heart,
  PawPrint,
  Sparkles,
  UserPlus,
  Utensils,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { signUp } from '../lib/auth-client'
import { getServerSession } from '../lib/auth-server'
import { ROLE_LABELS, SIGNUP_ROLES, roleToDashboard } from '../lib/permissions'
import type { SignupRole } from '../lib/permissions'

const HERO_IMG =
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1400&auto=format&fit=crop&q=80'

const ROLE_META: Record<
  SignupRole,
  { icon: LucideIcon; tone: string; description: string }
> = {
  RESTAURANT: {
    icon: Utensils,
    tone: 'text-orange-700 bg-orange-50 border-orange-200',
    description: 'Post surplus meals from your kitchen',
  },
  NGO: {
    icon: Sparkles,
    tone: 'text-blue-700 bg-blue-50 border-blue-200',
    description: 'Claim human-safe meals for the people you serve',
  },
  ANIMAL_RESCUE: {
    icon: PawPrint,
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    description: 'Pick up animal-safe scraps near you',
  },
}

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    const session = await getServerSession()
    if (session?.user) {
      throw redirect({
        to: roleToDashboard((session.user as { role?: string }).role),
      })
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<SignupRole>('RESTAURANT')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await signUp.email({
        email,
        password,
        name,
        role,
      } as Parameters<typeof signUp.email>[0])

      if (result.error) {
        setError(result.error.message ?? 'Sign up failed')
        return
      }
      const newRole =
        (result.data?.user as { role?: string } | undefined)?.role ?? role
      await router.navigate({ to: roleToDashboard(newRole) })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 lg:grid lg:grid-cols-[1fr_minmax(0,560px)]">
      {/* Photo column (left) */}
      <div className="relative hidden lg:block">
        <img
          src={HERO_IMG}
          alt="Volunteers preparing food"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur-sm">
            <Heart className="h-3 w-3" />
            Free for restaurants & non-profits
          </div>
          <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight text-white">
            Join 184 partners turning surplus into impact.
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/85">
            Set up your organization in under 2 minutes. No card. No contracts.
          </p>
        </div>
      </div>

      {/* Form column (right) */}
      <div className="flex min-h-screen flex-col px-6 py-10 sm:px-10 lg:min-h-0 lg:px-14 lg:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <div className="mt-10 flex flex-1 flex-col items-stretch lg:mt-12">
          <div className="mx-auto w-full max-w-md">
            <Link to="/" className="flex items-center gap-2 text-orange-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
                <Utensils className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                FoodSetu
              </span>
            </Link>

            <h1 className="mt-10 text-3xl font-semibold tracking-tight text-gray-900">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Tell us a bit about you and your team. You can add organization
              details next.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="Priya Singh"
                    autoComplete="name"
                  />
                </div>
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
                    placeholder="8+ characters"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  I am signing up as
                </label>
                <div className="grid gap-2">
                  {SIGNUP_ROLES.map((r) => {
                    const meta = ROLE_META[r]
                    const Icon = meta.icon
                    const active = role === r
                    return (
                      <label
                        key={r}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 text-sm transition focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 ${
                          active
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r}
                          checked={active}
                          onChange={() => setRole(r)}
                          className="sr-only"
                        />
                        <span
                          className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${meta.tone}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-gray-900">
                            {ROLE_LABELS[r]}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-600">
                            {meta.description}
                          </span>
                        </span>
                        <span
                          className={`mt-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                            active
                              ? 'border-orange-600 bg-orange-600'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {active ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
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
                <UserPlus className="h-4 w-4" />
                {submitting ? 'Creating account…' : 'Create account'}
              </button>

              <p className="text-center text-xs text-gray-500">
                By creating an account you agree to redistribute food
                responsibly and follow your local food-safety guidelines.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-orange-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
