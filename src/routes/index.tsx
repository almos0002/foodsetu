import { Link, createFileRoute } from '@tanstack/react-router'
import { Heart, LogIn, Sparkles, UserPlus, Utensils } from 'lucide-react'
import { useSession } from '../lib/auth-client'
import { ROLE_LABELS, roleToDashboard, type Role } from '../lib/permissions'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data: session, isPending } = useSession()
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Utensils className="h-10 w-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">FoodSetu</h1>
          </div>
          <nav className="flex items-center gap-2">
            {isPending ? null : user ? (
              <Link
                to={roleToDashboard(user.role) as string}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </header>

        <p className="mb-10 max-w-2xl text-lg font-light text-gray-700">
          A bridge between restaurants, hotels, and bakeries with surplus food and
          the NGOs, shelters, and animal-rescue groups that can put it to use.
        </p>

        {user ? (
          <div className="mb-10 rounded-2xl bg-white p-6 shadow-sm">
            <div className="text-sm text-gray-500">Signed in as</div>
            <div className="text-lg font-semibold text-gray-900">
              {user.name ?? user.email}
            </div>
            <div className="text-sm text-gray-600">
              Role: {ROLE_LABELS[(user.role as Role) ?? 'RESTAURANT']}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Utensils className="mb-3 h-6 w-6 text-orange-500" />
            <h2 className="mb-1 text-lg font-semibold">Restaurants</h2>
            <p className="text-sm text-gray-600">
              Post surplus meals in seconds. Categorize as human-safe, animal-safe,
              or compost.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Sparkles className="mb-3 h-6 w-6 text-amber-500" />
            <h2 className="mb-1 text-lg font-semibold">NGOs &amp; shelters</h2>
            <p className="text-sm text-gray-600">
              Get notified about nearby human-safe food and claim it before it
              expires.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <Heart className="mb-3 h-6 w-6 text-rose-500" />
            <h2 className="mb-1 text-lg font-semibold">Animal rescues</h2>
            <p className="text-sm text-gray-600">
              Pick up animal-safe surplus that would otherwise go to waste.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
