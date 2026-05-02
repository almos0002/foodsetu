import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, PawPrint, Salad, ShieldCheck, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { signUp } from '../lib/auth-client'
import { getServerSession } from '../lib/auth-server'
import { ROLE_LABELS, SIGNUP_ROLES, roleToDashboard } from '../lib/permissions'
import type { SignupRole } from '../lib/permissions'
import { BowlMascot } from './index'

const ROLE_META: Record<
  SignupRole,
  { icon: LucideIcon; description: string }
> = {
  RESTAURANT: {
    icon: Salad,
    description: 'Post surplus meals from your kitchen.',
  },
  NGO: {
    icon: ShieldCheck,
    description: 'Claim human-safe meals for the people you serve.',
  },
  ANIMAL_RESCUE: {
    icon: PawPrint,
    description: 'Pick up animal-safe scraps near you.',
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
    <div className="relative min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div
        className="grid-bg pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-xl px-5 py-8 sm:px-8 sm:py-12">
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
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-ink-2)]">
            Two minutes, no card. You can add organisation details right after.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  id="name"
                  label="Your name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Priya Singh"
                  autoComplete="name"
                  required
                />
              </div>
              <Field
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <Field
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="8+ characters"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-medium text-[var(--color-ink)]">
                I&rsquo;m signing up as
              </label>
              <div className="grid gap-2">
                {SIGNUP_ROLES.map((r) => {
                  const meta = ROLE_META[r]
                  const Icon = meta.icon
                  const active = role === r
                  return (
                    <label
                      key={r}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm transition-colors focus-within:ring-2 focus-within:ring-[var(--color-ink)] focus-within:ring-offset-2 ${
                        active
                          ? 'border-[var(--color-ink)] bg-[var(--color-canvas-2)]'
                          : 'border-[var(--color-line)] bg-[var(--color-canvas)] hover:border-[var(--color-line-strong)]'
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
                        className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border ${
                          active
                            ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white'
                            : 'border-[var(--color-line)] bg-[var(--color-canvas-2)] text-[var(--color-ink-2)]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-[var(--color-ink)]">
                          {ROLE_LABELS[r]}
                        </span>
                        <span className="mt-0.5 block text-xs text-[var(--color-ink-2)]">
                          {meta.description}
                        </span>
                      </span>
                      <span
                        className={`mt-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                          active
                            ? 'border-[var(--color-ink)] bg-[var(--color-ink)]'
                            : 'border-[var(--color-line-strong)] bg-[var(--color-canvas)]'
                        }`}
                      >
                        {active ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-canvas)]" />
                        ) : null}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

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
              <UserPlus className="h-4 w-4" />
              {submitting ? 'Creating account…' : 'Create my account'}
            </button>

            <p className="text-center text-xs text-[var(--color-ink-3)]">
              By creating an account you agree to redistribute food responsibly
              and follow your local food-safety guidelines.
            </p>
          </form>

          <p className="mt-7 text-center text-sm text-[var(--color-ink-2)]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-[var(--color-ink)] underline decoration-[var(--color-line-strong)] underline-offset-2 transition-colors hover:decoration-[var(--color-ink)]"
            >
              Sign in
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
