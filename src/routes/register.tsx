import { Link, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { UserPlus, Utensils } from 'lucide-react'
import { signUp } from '../lib/auth-client'
import { getServerSession } from '../lib/auth-server'
import {
  ROLE_LABELS,
  SIGNUP_ROLES,
  roleToDashboard,
  type SignupRole,
} from '../lib/permissions'

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    const session = await getServerSession()
    if (session?.user) {
      throw redirect({
        to: roleToDashboard((session.user as { role?: string }).role) as string,
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
        // role is an additional field defined on the server with input: true
        role,
      } as Parameters<typeof signUp.email>[0])

      if (result.error) {
        setError(result.error.message ?? 'Sign up failed')
        return
      }
      const newRole =
        (result.data?.user as { role?: string } | undefined)?.role ?? role
      await router.navigate({ to: roleToDashboard(newRole) as string })
      router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-orange-600">
          <Utensils className="h-7 w-7" />
          <span className="text-xl font-semibold">FoodSetu</span>
        </Link>

        <div className="rounded-lg border border-gray-200 bg-white p-6 sm:p-8">
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="mb-6 text-sm text-gray-600">Join FoodSetu to donate or receive surplus food.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">I am signing up as</label>
              <div className="space-y-2">
                {SIGNUP_ROLES.map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                      role === r
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-medium">{ROLE_LABELS[r]}</span>
                  </label>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-orange-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
