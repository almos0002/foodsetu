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

export function canCreateFoodListing(
  u: AuthUser,
  org?: AuthOrganization,
): boolean {
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

export function canClaimHumanFood(
  u: AuthUser,
  org?: AuthOrganization,
): boolean {
  return roleAndVerified(u, org ?? null, ['NGO'])
}

export function canClaimAnimalFood(
  u: AuthUser,
  org?: AuthOrganization,
): boolean {
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
  PENDING:
    'border-[var(--color-sun)] bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)]',
  VERIFIED:
    'border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)]',
  REJECTED:
    'border-[var(--color-coral)] bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)]',
  SUSPENDED:
    'border-[var(--color-line-strong)] bg-[var(--color-cream-2)] text-[var(--color-ink-2)]',
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
  DRAFT:
    'border-[var(--color-line-strong)] bg-[var(--color-cream)] text-[var(--color-ink-2)]',
  AVAILABLE:
    'border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)]',
  CLAIM_REQUESTED:
    'border-[var(--color-sky)] bg-[var(--color-sky-soft)] text-[var(--color-sky-ink)]',
  CLAIMED:
    'border-[var(--color-berry)] bg-[var(--color-berry-soft)] text-[var(--color-berry-ink)]',
  PICKED_UP:
    'border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)]',
  EXPIRED:
    'border-[var(--color-sun)] bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)]',
  CANCELLED:
    'border-[var(--color-line-strong)] bg-[var(--color-cream-2)] text-[var(--color-ink-2)]',
  REPORTED:
    'border-[var(--color-coral)] bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)]',
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

export function isListingCancelable(
  status: string | null | undefined,
): boolean {
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
  PENDING:
    'border-[var(--color-sun)] bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)]',
  ACCEPTED:
    'border-[var(--color-sky)] bg-[var(--color-sky-soft)] text-[var(--color-sky-ink)]',
  REJECTED:
    'border-[var(--color-coral)] bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)]',
  CANCELLED:
    'border-[var(--color-line-strong)] bg-[var(--color-cream-2)] text-[var(--color-ink-2)]',
  PICKED_UP:
    'border-[var(--color-berry)] bg-[var(--color-berry-soft)] text-[var(--color-berry-ink)]',
  COMPLETED:
    'border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)]',
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
  return (CANCELABLE_CLAIM_STATUSES as readonly string[]).includes(status ?? '')
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

// DB enum has 5 values today (see `report_reason` in src/db/schema.ts).
// User-facing labels follow the FoodSetu spec; the mapping is intentional:
//   SPOILED       → "Unsafe food"
//   MISLABELED    → "Wrong quantity"   (listing labelled with wrong info)
//   NO_SHOW       → "Pickup no-show"
//   INAPPROPRIATE → "Fake organization" (catch-all for bad-actor orgs)
//   OTHER         → "Other issue"
export const REPORT_REASONS = [
  'SPOILED',
  'MISLABELED',
  'NO_SHOW',
  'INAPPROPRIATE',
  'OTHER',
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPOILED: 'Unsafe food',
  MISLABELED: 'Wrong quantity',
  NO_SHOW: 'Pickup no-show',
  INAPPROPRIATE: 'Fake organization',
  OTHER: 'Other issue',
}

export const REPORT_REASON_HINTS: Record<ReportReason, string> = {
  SPOILED:
    'The food was spoiled, contaminated, or otherwise unsafe to consume.',
  MISLABELED:
    'The actual quantity, food type, or category did not match the listing.',
  NO_SHOW: 'The other party did not show up at the pickup window.',
  INAPPROPRIATE:
    'The organization appears fake, fraudulent, or otherwise inappropriate.',
  OTHER: 'Anything else that warrants admin attention.',
}

// The DB enum carries a 4th value `DISMISSED` (kept for backward-compat
// with rows already in the DB). The active workflow uses 3 statuses:
// OPEN → REVIEWED → RESOLVED. `setReportStatusFn` only accepts these 3.
export const REPORT_STATUSES = ['OPEN', 'REVIEWED', 'RESOLVED'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

// Internal mapping: REVIEWED is the user-facing label; the DB enum value
// is `REVIEWING`. Anything that touches the DB must translate via
// {@link reportStatusToDb} / {@link reportStatusFromDb}.
const REPORT_STATUS_DB: Record<ReportStatus, string> = {
  OPEN: 'OPEN',
  REVIEWED: 'REVIEWING',
  RESOLVED: 'RESOLVED',
}

export function reportStatusToDb(s: ReportStatus): string {
  return REPORT_STATUS_DB[s]
}

export function reportStatusFromDb(s: string | null | undefined): ReportStatus {
  if (s === 'OPEN') return 'OPEN'
  if (s === 'REVIEWING') return 'REVIEWED'
  if (s === 'RESOLVED') return 'RESOLVED'
  // Legacy DISMISSED rows surface as RESOLVED in the UI — they're terminal
  // either way and the spec doesn't expose Dismiss as a separate state.
  if (s === 'DISMISSED') return 'RESOLVED'
  return 'OPEN'
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: 'Open',
  REVIEWED: 'Reviewed',
  RESOLVED: 'Resolved',
}

export const REPORT_STATUS_BADGE_CLASSES: Record<ReportStatus, string> = {
  OPEN:
    'border-[var(--color-coral)] bg-[var(--color-coral-soft)] text-[var(--color-coral-ink)]',
  REVIEWED:
    'border-[var(--color-sun)] bg-[var(--color-sun-soft)] text-[var(--color-sun-ink)]',
  RESOLVED:
    'border-[var(--color-mint)] bg-[var(--color-mint-soft)] text-[var(--color-mint-ink)]',
}

export function isValidReportReason(v: unknown): v is ReportReason {
  return (
    typeof v === 'string' && (REPORT_REASONS as readonly string[]).includes(v)
  )
}

export function isValidReportStatus(v: unknown): v is ReportStatus {
  return (
    typeof v === 'string' && (REPORT_STATUSES as readonly string[]).includes(v)
  )
}

// Restrict post-login `?redirect=` to internal paths to prevent open-redirect.
// Accepted: starts with a single "/" and contains no scheme or protocol-relative prefix.
export function safeRedirectPath(
  input: string | null | undefined,
): string | null {
  if (!input || typeof input !== 'string') return null
  if (!input.startsWith('/')) return null
  if (input.startsWith('//')) return null
  if (input.includes('://')) return null
  // eslint-disable-next-line no-control-regex -- intentional: strip ASCII control chars from user-supplied redirect path.
  if (/[\s\x00-\x1f]/.test(input)) return null
  return input
}
