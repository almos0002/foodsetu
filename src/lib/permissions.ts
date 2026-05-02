export const ROLES = ['ADMIN', 'RESTAURANT', 'NGO', 'ANIMAL_RESCUE'] as const
export type Role = (typeof ROLES)[number]

export const SIGNUP_ROLES = ['RESTAURANT', 'NGO', 'ANIMAL_RESCUE'] as const
export type SignupRole = (typeof SIGNUP_ROLES)[number]

export type AuthUser = {
  role?: string | null
} | null
  | undefined

function roleOf(u: AuthUser): string | undefined {
  return u?.role ?? undefined
}

export function canAccessAdmin(u: AuthUser): boolean {
  return roleOf(u) === 'ADMIN'
}

export function canCreateFoodListing(u: AuthUser): boolean {
  const r = roleOf(u)
  return r === 'ADMIN' || r === 'RESTAURANT'
}

export function canClaimHumanFood(u: AuthUser): boolean {
  const r = roleOf(u)
  return r === 'ADMIN' || r === 'NGO'
}

export function canClaimAnimalFood(u: AuthUser): boolean {
  const r = roleOf(u)
  return r === 'ADMIN' || r === 'ANIMAL_RESCUE'
}

export function isValidRole(value: unknown): value is Role {
  return (
    typeof value === 'string' && (ROLES as readonly string[]).includes(value)
  )
}

export function roleToDashboard(role: string | null | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'RESTAURANT':
      return '/restaurant/dashboard'
    case 'NGO':
      return '/ngo/dashboard'
    case 'ANIMAL_RESCUE':
      return '/animal/dashboard'
    default:
      return '/login'
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  RESTAURANT: 'Restaurant / Hotel / Bakery',
  NGO: 'NGO / Shelter',
  ANIMAL_RESCUE: 'Animal Rescue',
}

// Restrict post-login `?redirect=` to internal paths to prevent open-redirect.
// Accepted: starts with a single "/" and contains no scheme or protocol-relative prefix.
export function safeRedirectPath(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null
  if (!input.startsWith('/')) return null
  if (input.startsWith('//')) return null
  if (input.includes('://')) return null
  // Reject control chars / whitespace
  if (/[\s\x00-\x1f]/.test(input)) return null
  return input
}
