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

// Stricter than canCreateFoodListing: the caller must actually own a RESTAURANT
// org (admins included). Mirrors `requireVerifiedRestaurantOrg` server-side, so
// the publish UI never appears for an admin who has no restaurant org to act on.
export function canManageRestaurantListings(
  u: AuthUser,
  org?: AuthOrganization,
): boolean {
  const r = roleOf(u)
  if (!r) return false
  if (!org || org.type !== 'RESTAURANT') return false
  if (r === 'ADMIN') return true
  if (r !== 'RESTAURANT') return false
  return isOrgVerified(org)
}

export function canClaimHumanFood(u: AuthUser, org?: AuthOrganization): boolean {
  return roleAndVerified(u, org ?? null, ['NGO'])
}

export function canClaimAnimalFood(u: AuthUser, org?: AuthOrganization): boolean {
  return roleAndVerified(u, org ?? null, ['ANIMAL_RESCUE'])
}

// Stricter than canClaimHumanFood: caller must actually own an NGO org
// (admins included). Mirrors `requireVerifiedClaimantOrg(user, NGO_KIND)`
// server-side, so the claim UI never appears for an admin who has no NGO
// org to act on.
export function canManageNgoClaims(
  u: AuthUser,
  org?: AuthOrganization,
): boolean {
  const r = roleOf(u)
  if (!r) return false
  if (!org || org.type !== 'NGO') return false
  if (r === 'ADMIN') return true
  if (r !== 'NGO') return false
  return isOrgVerified(org)
}

// Stricter than canClaimAnimalFood: caller must actually own an
// ANIMAL_RESCUE org (admins included). Mirrors
// `requireVerifiedClaimantOrg(user, ANIMAL_KIND)` server-side, so the claim
// UI never appears for an admin who has no animal-rescue org to act on.
export function canManageAnimalClaims(
  u: AuthUser,
  org?: AuthOrganization,
): boolean {
  const r = roleOf(u)
  if (!r) return false
  if (!org || org.type !== 'ANIMAL_RESCUE') return false
  if (r === 'ADMIN') return true
  if (r !== 'ANIMAL_RESCUE') return false
  return isOrgVerified(org)
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

// ---------------------------------------------------------------------------
// Food listings
// ---------------------------------------------------------------------------

export const LISTING_STATUSES = [
  'DRAFT',
  'AVAILABLE',
  'CLAIM_REQUESTED',
  'CLAIMED',
  'PICKED_UP',
  'EXPIRED',
  'CANCELLED',
  'REPORTED',
] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: 'Draft',
  AVAILABLE: 'Available',
  CLAIM_REQUESTED: 'Claim requested',
  CLAIMED: 'Claimed',
  PICKED_UP: 'Picked up',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  REPORTED: 'Reported',
}

export const LISTING_STATUS_BADGE_CLASSES: Record<ListingStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
  AVAILABLE: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  CLAIM_REQUESTED: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  CLAIMED: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200',
  PICKED_UP: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
  EXPIRED: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  CANCELLED: 'bg-gray-200 text-gray-700 ring-1 ring-gray-300',
  REPORTED: 'bg-red-100 text-red-800 ring-1 ring-red-200',
}

// Active = listing is still in the live pipeline (visible to claimants or
// in-progress). History = terminal states.
export const ACTIVE_LISTING_STATUSES: readonly ListingStatus[] = [
  'DRAFT',
  'AVAILABLE',
  'CLAIM_REQUESTED',
  'CLAIMED',
]
export const HISTORY_LISTING_STATUSES: readonly ListingStatus[] = [
  'PICKED_UP',
  'EXPIRED',
  'CANCELLED',
  'REPORTED',
]

// A restaurant may edit only while no claimant action has happened yet.
export const EDITABLE_LISTING_STATUSES: readonly ListingStatus[] = [
  'DRAFT',
  'AVAILABLE',
]

// A restaurant may cancel only while no claimant has locked it.
// (Once CLAIM_REQUESTED/CLAIMED a claimant has skin in the game; cancellation
// requires a separate "withdraw" flow handled in the claim system.)
export const CANCELABLE_LISTING_STATUSES: readonly ListingStatus[] = [
  'DRAFT',
  'AVAILABLE',
]

export function isListingEditable(status: string | null | undefined): boolean {
  return (EDITABLE_LISTING_STATUSES as readonly string[]).includes(status ?? '')
}

export function isListingCancelable(status: string | null | undefined): boolean {
  return (CANCELABLE_LISTING_STATUSES as readonly string[]).includes(
    status ?? '',
  )
}

export const FOOD_CATEGORIES = ['HUMAN_SAFE', 'ANIMAL_SAFE'] as const
export type FoodCategory = (typeof FOOD_CATEGORIES)[number]

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  HUMAN_SAFE: 'Human-safe',
  ANIMAL_SAFE: 'Animal-safe',
}

export const FOOD_TYPES = [
  'COOKED',
  'BAKERY',
  'PACKAGED',
  'RAW',
  'OTHER',
] as const
export type FoodType = (typeof FOOD_TYPES)[number]

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  COOKED: 'Cooked meal',
  BAKERY: 'Bakery',
  PACKAGED: 'Packaged',
  RAW: 'Raw / produce',
  OTHER: 'Other',
}

export const QUANTITY_UNITS = [
  'kg',
  'plates',
  'meals',
  'liters',
  'units',
  'packets',
  'boxes',
] as const
export type QuantityUnit = (typeof QUANTITY_UNITS)[number]

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export const CLAIM_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'PICKED_UP',
  'COMPLETED',
] as const
export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  PICKED_UP: 'Picked up',
  COMPLETED: 'Completed',
}

export const CLAIM_STATUS_BADGE_CLASSES: Record<ClaimStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  ACCEPTED: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',
  REJECTED: 'bg-red-100 text-red-800 ring-1 ring-red-200',
  CANCELLED: 'bg-gray-200 text-gray-700 ring-1 ring-gray-300',
  PICKED_UP: 'bg-purple-100 text-purple-800 ring-1 ring-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
}

export const ACTIVE_CLAIM_STATUSES: readonly ClaimStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PICKED_UP',
]
export const HISTORY_CLAIM_STATUSES: readonly ClaimStatus[] = [
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
]

// A claimant may withdraw a claim only while it has not yet been picked up.
export const CANCELABLE_CLAIM_STATUSES: readonly ClaimStatus[] = [
  'PENDING',
  'ACCEPTED',
]

export function isClaimActive(status: string | null | undefined): boolean {
  return (ACTIVE_CLAIM_STATUSES as readonly string[]).includes(status ?? '')
}

export function isClaimCancelable(status: string | null | undefined): boolean {
  return (CANCELABLE_CLAIM_STATUSES as readonly string[]).includes(
    status ?? '',
  )
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
