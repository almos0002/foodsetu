import { Link, useRouter } from '@tanstack/react-router'
import { LogOut, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import { signOut } from '../lib/auth-client'

type Props = {
  title: string
  roleLabel: string
  user: { name?: string | null; email?: string | null }
  children: ReactNode
}

export function DashboardShell({ title, roleLabel, user, children }: Props) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-orange-600">
            <Utensils className="h-6 w-6" />
            <span className="text-lg font-semibold">FoodSetu</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-gray-900">{user.name ?? user.email}</div>
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
        <h1 className="mb-1 text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mb-6 text-sm text-gray-600">{roleLabel} workspace</p>
        {children}
      </main>
    </div>
  )
}
