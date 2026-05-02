export const ROLES = ['ADMIN', 'RESTAURANT', 'NGO', 'ANIMAL_RESCUE'] as const
export type Role = (typeof ROLES)[number]

export const SIGNUP_ROLES = ['RESTAURANT', 'NGO', 'ANIMAL_RESCUE'] as const
export type SignupRole = (typeof SIGNUP_ROLES)[number]

export const VERIFICATION_STATUSES = [
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export type AuthUser =
  | {
      role?: string | null
    }
  | null
  | undefined

export type AuthOrganization =
  | {
      verificationStatus?: string | null
      type?: string | null
    }
  | null
  | undefined

function roleOf(u: AuthUser): string | undefined {
  return u?.role ?? undefined
}

export function canAccessAdmin(u: AuthUser): boolean {
  return roleOf(u) === 'ADMIN'
}

export function canManageOrgVerification(u: AuthUser): boolean {
  return roleOf(u) === 'ADMIN'
}

export function isOrgVerified(org: AuthOrganization): boolean {
  return (org?.verificationStatus ?? null) === 'VERIFIED'
}

// Role + verification gate. Admin bypasses the verification requirement.
function roleAndVerified(
  u: AuthUser,
  org: AuthOrganization,
  allowedRoles: readonly string[],
): boolean {
  const r = roleOf(u)
  if (!r) return false
  if (r === 'ADMIN') return true
  if (!allowedRoles.includes(r)) return false
  return isOrgVerified(org)
}

export function canCreateFoodListing(u: AuthUser, org?: AuthOrganization): boolean {
  return roleAndVerified(u, org ?? null, ['RESTAURANT'])
}

export function canClaimHumanFood(u: AuthUser, org?: AuthOrganization): boolean {
  return roleAndVerified(u, org ?? null, ['NGO'])
}

export function canClaimAnimalFood(u: AuthUser, org?: AuthOrganization): boolean {
  return roleAndVerified(u, org ?? null, ['ANIMAL_RESCUE'])
}

// True if a non-admin user must have a verified org to act on the platform.
// (ADMIN doesn't need an org at all.)
export function requiresOrganization(u: AuthUser): boolean {
  const r = roleOf(u)
  return r === 'RESTAURANT' || r === 'NGO' || r === 'ANIMAL_RESCUE'
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

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  PENDING: 'Pending review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
}

export const VERIFICATION_BADGE_CLASSES: Record<VerificationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  VERIFIED: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  REJECTED: 'bg-red-100 text-red-800 ring-1 ring-red-200',
  SUSPENDED: 'bg-gray-200 text-gray-800 ring-1 ring-gray-300',
}

// Restrict post-login `?redirect=` to internal paths to prevent open-redirect.
// Accepted: starts with a single "/" and contains no scheme or protocol-relative prefix.
export function safeRedirectPath(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null
  if (!input.startsWith('/')) return null
  if (input.startsWith('//')) return null
  if (input.includes('://')) return null
  if (/[\s\x00-\x1f]/.test(input)) return null
  return input
}
