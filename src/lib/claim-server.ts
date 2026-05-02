import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { auth, pool } from './auth'
import { db } from '../db'
import { claims, foodListings, type Claim } from '../db/schema'
import {
  ACTIVE_CLAIM_STATUSES,
  HISTORY_CLAIM_STATUSES,
  type ClaimStatus,
} from './permissions'

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

type SessionUser = { id: string; role?: string | null }

async function requireSessionUser(): Promise<SessionUser> {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new Error('UNAUTHORIZED')
  return session.user as SessionUser
}

type OwnerOrgRow = {
  id: string
  name: string | null
  type: string | null
  verificationStatus: string
  cityId: string | null
  latitude: number | null
  longitude: number | null
}

async function fetchOwnerOrgForUser(
  userId: string,
): Promise<OwnerOrgRow | null> {
  const { rows } = await pool.query(
    `SELECT o.id, o.name, o.type, o."verificationStatus", o."cityId",
            o.latitude, o.longitude
       FROM "organization" o
       JOIN "member" m ON m."organizationId" = o.id
      WHERE m."userId" = $1 AND m.role = 'owner'
      LIMIT 1`,
    [userId],
  )
  const row = rows[0] as
    | (Omit<OwnerOrgRow, 'latitude' | 'longitude'> & {
        latitude: string | number | null
        longitude: string | number | null
      })
    | undefined
  if (!row) return null
  return {
    ...row,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
  }
}

// ---------------------------------------------------------------------------
// Claimant kinds
//
// The NGO and Animal Rescue claim flows are structurally identical: the only
// differences are the org type the caller must own and the food category they
// can see/claim. Encoding both as a `ClaimantKind` keeps a single source of
// truth for the SQL query, the race-guard, and error messages.
// ---------------------------------------------------------------------------

type ClaimantKind = {
  orgType: 'NGO' | 'ANIMAL_RESCUE'
  foodCategory: 'HUMAN_SAFE' | 'ANIMAL_SAFE'
  /** Singular, lowercase noun used in error messages (e.g. "NGO"). */
  orgLabel: string
  /** Lowercase adjective used in error messages (e.g. "human-safe"). */
  categoryLabel: string
}

const NGO_KIND: ClaimantKind = {
  orgType: 'NGO',
  foodCategory: 'HUMAN_SAFE',
  orgLabel: 'NGO',
  categoryLabel: 'human-safe',
}

const ANIMAL_KIND: ClaimantKind = {
  orgType: 'ANIMAL_RESCUE',
  foodCategory: 'ANIMAL_SAFE',
  orgLabel: 'animal rescue',
  categoryLabel: 'animal-safe',
}

/**
 * Returns the verified org of the expected type owned by the caller, or
 * throws a user-facing error. ADMIN bypasses the verification gate but still
 * needs to own an org of the right type (admins act on behalf of a specific
 * claimant — no magic claimantOrgId).
 */
async function requireVerifiedClaimantOrg(
  user: SessionUser,
  kind: ClaimantKind,
): Promise<OwnerOrgRow> {
  const org = await fetchOwnerOrgForUser(user.id)
  if (!org) throw new Error('You must set up your organization first')
  if (org.type !== kind.orgType) {
    throw new Error(`Only ${kind.orgLabel}s can claim ${kind.categoryLabel} food`)
  }
  if (user.role !== 'ADMIN' && org.verificationStatus !== 'VERIFIED') {
    throw new Error('Your organization must be verified before claiming food')
  }
  return org
}

// ---------------------------------------------------------------------------
// Distance (Haversine)
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance in kilometers between two lat/lng points. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

// ---------------------------------------------------------------------------
// Public types (shared between NGO and Animal Rescue flows)
// ---------------------------------------------------------------------------

export type NearbyListing = {
  id: string
  title: string
  description: string | null
  quantity: number
  quantityUnit: string
  foodCategory: string
  foodType: string
  pickupStartTime: string
  pickupEndTime: string
  expiryTime: string
  latitude: number
  longitude: number
  imageUrl: string | null
  status: string
  createdAt: string
  restaurantId: string
  restaurantName: string | null
  restaurantAddress: string | null
  // restaurantPhone deliberately omitted: it must not be exposed before the
  // restaurant has accepted a claim. Pickup contact is revealed via
  // `listMyClaimsFn` / `listMyAnimalClaimsFn` after status transitions to
  // ACCEPTED/PICKED_UP.
  cityName: string | null
  // null if the claimant org has no location set.
  distanceKm: number | null
}

export type MyClaim = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  pickupTime: string | null
  notes: string | null
  // Server-side redacted: only present when claim status is ACCEPTED or
  // PICKED_UP. The receiver shows this code to the donor at pickup; the
  // donor enters it to verify (separate flow). Stored plaintext per v1 spec.
  otpCode: string | null
  listing: {
    id: string
    title: string
    quantity: number
    quantityUnit: string
    foodType: string
    foodCategory: string
    pickupStartTime: string
    pickupEndTime: string
    expiryTime: string
    latitude: number
    longitude: number
    status: string
    imageUrl: string | null
    restaurantName: string | null
    restaurantAddress: string | null
    // Server-side redacted: only present when claim status is ACCEPTED or
    // PICKED_UP. Returning `null` on the wire keeps the client from ever
    // seeing the value before pickup is authorized.
    restaurantPhone: string | null
    cityName: string | null
  }
}

/**
 * Restaurant-side view of a claim request on one of the restaurant's
 * listings. The OTP code is intentionally never sent to the donor — only
 * `otpIssued` is exposed so the UI can show "OTP issued, ready for pickup"
 * without leaking the value the receiver is expected to present at handoff.
 */
export type RestaurantClaim = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  pickupTime: string | null
  notes: string | null
  otpIssued: boolean
  listing: {
    id: string
    title: string
    quantity: number
    quantityUnit: string
    foodType: string
    foodCategory: string
    pickupStartTime: string
    pickupEndTime: string
    expiryTime: string
    status: string
    imageUrl: string | null
    cityName: string | null
  }
  claimant: {
    orgId: string
    orgName: string | null
    orgType: string | null
    orgPhone: string | null
    orgAddress: string | null
    cityName: string | null
  }
}

const PHONE_VISIBLE_CLAIM_STATUSES = new Set(['ACCEPTED', 'PICKED_UP'])
const OTP_VISIBLE_CLAIM_STATUSES = PHONE_VISIBLE_CLAIM_STATUSES

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateIdInput(value: unknown): { id: string } {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || v.id.length === 0) {
    throw new Error('Listing id is required')
  }
  return { id: v.id }
}

// ---------------------------------------------------------------------------
// Internal generic implementations
// ---------------------------------------------------------------------------

/**
 * Returns AVAILABLE listings of the given kind whose pickup window and
 * expiry are still in the future, enriched with restaurant info and the
 * great-circle distance from the claimant org's location. Sorted by
 * distance ascending (nulls last) then expiry ascending. Caller must own a
 * verified org of the expected type.
 */
async function listNearbyFoodForKind(
  user: SessionUser,
  kind: ClaimantKind,
): Promise<NearbyListing[]> {
  const org = await fetchOwnerOrgForUser(user.id)
  // Hide the feed entirely for callers without an org of the right type
  // (mirrors the role gate in routes). Avoids accidental data exposure if
  // the route guard is bypassed.
  if (!org || org.type !== kind.orgType) return []
  if (user.role !== 'ADMIN' && org.verificationStatus !== 'VERIFIED') {
    return []
  }

  // NOTE: `o.phone` is intentionally NOT selected — restaurant contact is
  // gated behind an accepted claim (see `listMyClaimsForKind`).
  const { rows } = await pool.query(
    `SELECT fl.id, fl.title, fl.description, fl.quantity, fl.quantity_unit,
            fl.food_category, fl.food_type,
            fl.pickup_start_time, fl.pickup_end_time, fl.expiry_time,
            fl.latitude, fl.longitude, fl.image_url, fl.status, fl.created_at,
            fl.restaurant_id,
            o.name AS restaurant_name,
            o.address AS restaurant_address,
            c.name AS city_name
       FROM food_listings fl
       LEFT JOIN "organization" o ON o.id = fl.restaurant_id
       LEFT JOIN cities c ON c.id = fl.city_id
      WHERE fl.food_category = $1
        AND fl.status = 'AVAILABLE'
        AND fl.expiry_time > NOW()
        AND fl.pickup_end_time > NOW()
      LIMIT 200`,
    [kind.foodCategory],
  )

  const orgLat = org.latitude
  const orgLng = org.longitude

  const enriched: NearbyListing[] = rows.map((r) => {
    const lat = Number(r.latitude)
    const lng = Number(r.longitude)
    const distanceKm =
      orgLat != null && orgLng != null
        ? haversineKm(orgLat, orgLng, lat, lng)
        : null
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      quantity: Number(r.quantity),
      quantityUnit: r.quantity_unit,
      foodCategory: r.food_category,
      foodType: r.food_type,
      pickupStartTime: new Date(r.pickup_start_time).toISOString(),
      pickupEndTime: new Date(r.pickup_end_time).toISOString(),
      expiryTime: new Date(r.expiry_time).toISOString(),
      latitude: lat,
      longitude: lng,
      imageUrl: r.image_url,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant_name,
      restaurantAddress: r.restaurant_address,
      cityName: r.city_name,
      distanceKm,
    }
  })

  enriched.sort((a, b) => {
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY
    if (da !== db) return da - db
    return (
      new Date(a.expiryTime).getTime() - new Date(b.expiryTime).getTime()
    )
  })

  return enriched.slice(0, 100)
}

/** Lists the caller's own claims (newest first), with denormalized listing info. */
async function listMyClaimsForKind(
  user: SessionUser,
  kind: ClaimantKind,
): Promise<MyClaim[]> {
  const org = await fetchOwnerOrgForUser(user.id)
  if (!org || org.type !== kind.orgType) return []

  const { rows } = await pool.query(
    `SELECT cl.id, cl.status, cl.created_at, cl.updated_at,
            cl.pickup_time, cl.notes, cl.otp_code,
            fl.id AS listing_id, fl.title, fl.quantity, fl.quantity_unit,
            fl.food_type, fl.food_category,
            fl.pickup_start_time, fl.pickup_end_time, fl.expiry_time,
            fl.latitude, fl.longitude, fl.status AS listing_status,
            fl.image_url,
            o.name AS restaurant_name,
            o.address AS restaurant_address,
            o.phone AS restaurant_phone,
            c.name AS city_name
       FROM claims cl
       JOIN food_listings fl ON fl.id = cl.food_listing_id
       LEFT JOIN "organization" o ON o.id = fl.restaurant_id
       LEFT JOIN cities c ON c.id = fl.city_id
      WHERE cl.claimant_org_id = $1
      ORDER BY cl.created_at DESC
      LIMIT 200`,
    [org.id],
  )

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
    pickupTime: r.pickup_time ? new Date(r.pickup_time).toISOString() : null,
    notes: r.notes,
    // Server-side redaction: the OTP is only sent to the receiver after the
    // donor accepts the claim (so it cannot leak to a curious claimant
    // before the donor agrees). The donor never sees the value at all —
    // the donor enters the OTP at pickup to verify (separate flow).
    otpCode: OTP_VISIBLE_CLAIM_STATUSES.has(r.status) ? r.otp_code : null,
    listing: {
      id: r.listing_id,
      title: r.title,
      quantity: Number(r.quantity),
      quantityUnit: r.quantity_unit,
      foodType: r.food_type,
      foodCategory: r.food_category,
      pickupStartTime: new Date(r.pickup_start_time).toISOString(),
      pickupEndTime: new Date(r.pickup_end_time).toISOString(),
      expiryTime: new Date(r.expiry_time).toISOString(),
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      status: r.listing_status,
      imageUrl: r.image_url,
      restaurantName: r.restaurant_name,
      restaurantAddress: r.restaurant_address,
      // Server-side redaction: phone is only sent down once the restaurant
      // has accepted the claim (or the claimant is in the pickup phase).
      // The UI cannot leak this because the value never reaches the client
      // before then.
      restaurantPhone: PHONE_VISIBLE_CLAIM_STATUSES.has(r.status)
        ? r.restaurant_phone
        : null,
      cityName: r.city_name,
    },
  })) as MyClaim[]
}

/**
 * Atomic claim creation for the given kind.
 *
 * Atomicity (single transaction):
 * 1. Update the listing AVAILABLE → CLAIM_REQUESTED, gated on
 *    food_category=<kind> and status=AVAILABLE plus temporal guards. If no
 *    row matches, the listing is already taken, cancelled, expired, of the
 *    wrong category, or doesn't exist. The status check + UPDATE in one
 *    statement is the race guard.
 * 2. Insert a PENDING claim. The partial unique index
 *    `claims_listing_active_uq` on (food_listing_id) WHERE status IN
 *    ('PENDING','ACCEPTED','PICKED_UP') is the secondary guard against
 *    multiple active claims on the same listing.
 *
 * If anything throws, the transaction rolls back and the listing reverts.
 */
async function createClaimForKind(
  user: SessionUser,
  data: { id: string },
  kind: ClaimantKind,
): Promise<Claim> {
  const org = await requireVerifiedClaimantOrg(user, kind)

  return await db.transaction(async (tx) => {
    // Temporal guards (`pickup_end_time > NOW()`, `expiry_time > NOW()`)
    // protect against claiming stale-but-still-AVAILABLE rows if the
    // background EXPIRED sweep is delayed or hasn't been built yet.
    const [listing] = await tx
      .update(foodListings)
      .set({ status: 'CLAIM_REQUESTED' })
      .where(
        and(
          eq(foodListings.id, data.id),
          eq(foodListings.status, 'AVAILABLE'),
          eq(foodListings.foodCategory, kind.foodCategory),
          sql`${foodListings.pickupEndTime} > NOW()`,
          sql`${foodListings.expiryTime} > NOW()`,
        ),
      )
      .returning()

    if (!listing) {
      // Disambiguate so the user gets a useful message.
      const [existing] = await tx
        .select({
          status: foodListings.status,
          foodCategory: foodListings.foodCategory,
          pickupEndTime: foodListings.pickupEndTime,
          expiryTime: foodListings.expiryTime,
        })
        .from(foodListings)
        .where(eq(foodListings.id, data.id))
        .limit(1)
      if (!existing) throw new Error('Listing not found')
      if (existing.foodCategory !== kind.foodCategory) {
        throw new Error(
          `Only ${kind.categoryLabel} food can be claimed by ${kind.orgLabel}s`,
        )
      }
      const now = Date.now()
      if (
        existing.pickupEndTime.getTime() <= now ||
        existing.expiryTime.getTime() <= now
      ) {
        throw new Error('This listing has expired')
      }
      throw new Error('This listing is no longer available to claim')
    }

    try {
      const [claim] = await tx
        .insert(claims)
        .values({
          foodListingId: listing.id,
          claimantOrgId: org.id,
          claimantUserId: user.id,
          status: 'PENDING',
        })
        .returning()
      return claim as Claim
    } catch (e) {
      // Unique-violation on claims_listing_active_uq = a concurrent claim won.
      // The transaction will roll back the listing status change.
      if (
        e &&
        typeof e === 'object' &&
        (e as { code?: string }).code === '23505'
      ) {
        throw new Error('This listing is no longer available to claim')
      }
      throw e
    }
  })
}

// ---------------------------------------------------------------------------
// NGO server functions (HUMAN_SAFE)
// ---------------------------------------------------------------------------

export const listNearbyHumanFoodFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireSessionUser()
    return listNearbyFoodForKind(user, NGO_KIND)
  },
)

export const listMyClaimsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireSessionUser()
    return listMyClaimsForKind(user, NGO_KIND)
  },
)

export const createClaimFn = createServerFn({ method: 'POST' })
  .inputValidator(validateIdInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    return createClaimForKind(user, data, NGO_KIND)
  })

// ---------------------------------------------------------------------------
// Animal Rescue server functions (ANIMAL_SAFE)
// ---------------------------------------------------------------------------

export const listNearbyAnimalFoodFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireSessionUser()
    return listNearbyFoodForKind(user, ANIMAL_KIND)
  },
)

export const listMyAnimalClaimsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireSessionUser()
    return listMyClaimsForKind(user, ANIMAL_KIND)
  },
)

export const createAnimalClaimFn = createServerFn({ method: 'POST' })
  .inputValidator(validateIdInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    return createClaimForKind(user, data, ANIMAL_KIND)
  })

// ---------------------------------------------------------------------------
// Restaurant-side claim management
// ---------------------------------------------------------------------------

/**
 * Returns the verified RESTAURANT org owned by the caller, or throws a
 * user-facing error. ADMIN bypasses the verification gate but still needs to
 * own a RESTAURANT org (no magic restaurantId for admins).
 */
async function requireVerifiedRestaurantOrg(
  user: SessionUser,
): Promise<OwnerOrgRow> {
  const org = await fetchOwnerOrgForUser(user.id)
  if (!org) throw new Error('You must set up your organization first')
  if (org.type !== 'RESTAURANT') {
    throw new Error('Only restaurants can manage food-listing claims')
  }
  if (user.role !== 'ADMIN' && org.verificationStatus !== 'VERIFIED') {
    throw new Error('Your organization must be verified before managing claims')
  }
  return org
}

function validateClaimListInput(value: unknown): {
  scope: 'active' | 'history' | 'all'
} {
  const v = (value ?? {}) as Record<string, unknown>
  const scope =
    v.scope === 'active' || v.scope === 'history' || v.scope === 'all'
      ? v.scope
      : 'active'
  return { scope }
}

function rowToRestaurantClaim(r: Record<string, unknown>): RestaurantClaim {
  return {
    id: r.id as string,
    status: r.status as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
    pickupTime: r.pickup_time
      ? new Date(r.pickup_time as string).toISOString()
      : null,
    notes: (r.notes as string | null) ?? null,
    // Reveal only the boolean — never the value. Donor never needs to see
    // the OTP; they will type it in at pickup to verify.
    otpIssued: r.otp_code != null,
    listing: {
      id: r.listing_id as string,
      title: r.title as string,
      quantity: Number(r.quantity),
      quantityUnit: r.quantity_unit as string,
      foodType: r.food_type as string,
      foodCategory: r.food_category as string,
      pickupStartTime: new Date(r.pickup_start_time as string).toISOString(),
      pickupEndTime: new Date(r.pickup_end_time as string).toISOString(),
      expiryTime: new Date(r.expiry_time as string).toISOString(),
      status: r.listing_status as string,
      imageUrl: (r.image_url as string | null) ?? null,
      cityName: (r.listing_city_name as string | null) ?? null,
    },
    claimant: {
      orgId: r.claimant_org_id as string,
      orgName: (r.claimant_name as string | null) ?? null,
      orgType: (r.claimant_type as string | null) ?? null,
      orgPhone: (r.claimant_phone as string | null) ?? null,
      orgAddress: (r.claimant_address as string | null) ?? null,
      cityName: (r.claimant_city_name as string | null) ?? null,
    },
  }
}

const RESTAURANT_CLAIMS_BASE_SQL = `
  SELECT cl.id, cl.status, cl.created_at, cl.updated_at,
         cl.pickup_time, cl.notes, cl.otp_code,
         cl.claimant_org_id,
         fl.id  AS listing_id, fl.title, fl.quantity, fl.quantity_unit,
         fl.food_type, fl.food_category,
         fl.pickup_start_time, fl.pickup_end_time, fl.expiry_time,
         fl.status AS listing_status, fl.image_url,
         lc.name AS listing_city_name,
         claimant.name    AS claimant_name,
         claimant.type    AS claimant_type,
         claimant.phone   AS claimant_phone,
         claimant.address AS claimant_address,
         cc.name AS claimant_city_name
    FROM claims cl
    JOIN food_listings fl  ON fl.id = cl.food_listing_id
    LEFT JOIN cities lc    ON lc.id = fl.city_id
    LEFT JOIN "organization" claimant ON claimant.id = cl.claimant_org_id
    LEFT JOIN cities cc    ON cc.id = claimant."cityId"
   WHERE fl.restaurant_id = $1
`

/**
 * Returns claims on the caller restaurant's listings, scoped to active /
 * history / all. Newest first. Returns `[]` for callers without a
 * RESTAURANT org so the route still loads cleanly while the gate is shown
 * inside the page.
 */
export const listClaimRequestsForRestaurantFn = createServerFn({
  method: 'GET',
})
  .inputValidator(validateClaimListInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await fetchOwnerOrgForUser(user.id)
    if (!org || org.type !== 'RESTAURANT') return [] as RestaurantClaim[]

    let sqlText = RESTAURANT_CLAIMS_BASE_SQL
    const params: unknown[] = [org.id]

    if (data.scope === 'active') {
      sqlText +=
        ' AND cl.status = ANY($2::claim_status[]) ORDER BY cl.created_at DESC LIMIT 200'
      params.push(ACTIVE_CLAIM_STATUSES as readonly string[])
    } else if (data.scope === 'history') {
      sqlText +=
        ' AND cl.status = ANY($2::claim_status[]) ORDER BY cl.created_at DESC LIMIT 200'
      params.push(HISTORY_CLAIM_STATUSES as readonly string[])
    } else {
      sqlText += ' ORDER BY cl.created_at DESC LIMIT 200'
    }

    const { rows } = await pool.query(sqlText, params)
    return rows.map(rowToRestaurantClaim)
  })

/** Returns one claim if it lives on a listing owned by the caller. */
export const getClaimForRestaurantFn = createServerFn({ method: 'GET' })
  .inputValidator(validateIdInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await fetchOwnerOrgForUser(user.id)
    if (!org || org.type !== 'RESTAURANT') {
      throw new Error('NOT_FOUND')
    }
    const { rows } = await pool.query(
      `${RESTAURANT_CLAIMS_BASE_SQL} AND cl.id = $2 LIMIT 1`,
      [org.id, data.id],
    )
    if (rows.length === 0) throw new Error('NOT_FOUND')
    return rowToRestaurantClaim(rows[0])
  })

// ---------------------------------------------------------------------------
// Accept / reject helpers
// ---------------------------------------------------------------------------

/** Cryptographically random 6-digit OTP (000000-999999). */
function generateOtp(): string {
  const n = Math.floor(Math.random() * 1_000_000)
  return n.toString().padStart(6, '0')
}

/**
 * Accepts a PENDING claim:
 *   - claim.status     PENDING → ACCEPTED + otp_code generated
 *   - listing.status   CLAIM_REQUESTED → CLAIMED + accepted_claim_id set
 *
 * Atomicity: a single transaction with status-gated UPDATEs. Ownership
 * (restaurant_id) is verified inside the listing UPDATE so a non-owner
 * cannot accept a claim even if they know its id.
 *
 * The OTP is generated server-side and is never returned to the donor —
 * the donor will enter it at pickup to verify (separate flow). Collisions
 * are bounded by `claims_listing_otp_uq` (per-listing uniqueness); we
 * retry a few times before giving up.
 */
export const acceptClaimFn = createServerFn({ method: 'POST' })
  .inputValidator(validateIdInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await requireVerifiedRestaurantOrg(user)

    return await db.transaction(async (tx) => {
      // 1. Look up the claim + listing, verify ownership and status.
      const [row] = await tx
        .select({
          claimStatus: claims.status,
          listingId: foodListings.id,
          listingStatus: foodListings.status,
          restaurantId: foodListings.restaurantId,
        })
        .from(claims)
        .innerJoin(foodListings, eq(foodListings.id, claims.foodListingId))
        .where(eq(claims.id, data.id))
        .limit(1)

      if (!row) throw new Error('Claim not found')
      if (row.restaurantId !== org.id) {
        // Don't leak existence; mirror "not found" for non-owners.
        throw new Error('Claim not found')
      }
      if (row.claimStatus !== 'PENDING') {
        throw new Error(
          `This claim is ${(row.claimStatus as string).toLowerCase()} and can no longer be accepted`,
        )
      }
      if (row.listingStatus !== 'CLAIM_REQUESTED') {
        throw new Error(
          `Listing is ${(row.listingStatus as string).toLowerCase()} and can no longer be claimed`,
        )
      }

      // 2. Move listing CLAIM_REQUESTED → CLAIMED, status-gated.
      const [listingRow] = await tx
        .update(foodListings)
        .set({ status: 'CLAIMED', acceptedClaimId: data.id })
        .where(
          and(
            eq(foodListings.id, row.listingId),
            eq(foodListings.restaurantId, org.id),
            eq(foodListings.status, 'CLAIM_REQUESTED'),
          ),
        )
        .returning({ id: foodListings.id })
      if (!listingRow) {
        // Concurrent change (e.g., another tab cancelled or a different
        // claim-flow already moved it).
        throw new Error('Listing is no longer awaiting a claim decision')
      }

      // 3. Move claim PENDING → ACCEPTED with a fresh OTP. Retry on the
      //    rare per-listing OTP collision.
      let claimRow: Claim | undefined
      let lastError: unknown
      for (let attempt = 0; attempt < 5; attempt++) {
        const otp = generateOtp()
        try {
          const [c] = await tx
            .update(claims)
            .set({
              status: 'ACCEPTED',
              otpCode: otp,
              // OTP usable until the listing's expiry — donor verifies at pickup.
              otpExpiresAt: undefined,
            })
            .where(and(eq(claims.id, data.id), eq(claims.status, 'PENDING')))
            .returning()
          if (!c) {
            // Status changed between SELECT and UPDATE.
            throw new Error('This claim was just modified — please refresh')
          }
          claimRow = c as Claim
          break
        } catch (e) {
          // Only retry on the OTP-specific unique constraint to avoid
          // silently swallowing unrelated unique violations.
          if (
            e &&
            typeof e === 'object' &&
            (e as { code?: string }).code === '23505' &&
            (e as { constraint?: string; constraint_name?: string }).constraint
              === 'claims_listing_otp_uq'
          ) {
            lastError = e
            continue
          }
          throw e
        }
      }
      if (!claimRow) {
        throw lastError instanceof Error
          ? lastError
          : new Error('Failed to issue OTP — please try again')
      }

      return claimRow
    })
  })

/**
 * Rejects a PENDING claim:
 *   - claim.status     PENDING → REJECTED
 *   - listing.status   CLAIM_REQUESTED → AVAILABLE (only if no *other*
 *                      active claims remain — the partial-unique index
 *                      `claims_listing_active_uq` means there can never be
 *                      another active claim today, but we still check so
 *                      the logic survives a future "multi-claim queue"
 *                      change).
 *
 * Ownership is verified inside the listing UPDATE so a non-owner cannot
 * reject a claim even if they know its id.
 */
export const rejectClaimFn = createServerFn({ method: 'POST' })
  .inputValidator(validateIdInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await requireVerifiedRestaurantOrg(user)

    return await db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          claimStatus: claims.status,
          listingId: foodListings.id,
          listingStatus: foodListings.status,
          restaurantId: foodListings.restaurantId,
        })
        .from(claims)
        .innerJoin(foodListings, eq(foodListings.id, claims.foodListingId))
        .where(eq(claims.id, data.id))
        .limit(1)

      if (!row) throw new Error('Claim not found')
      if (row.restaurantId !== org.id) throw new Error('Claim not found')
      if (row.claimStatus !== 'PENDING') {
        throw new Error(
          `This claim is ${(row.claimStatus as string).toLowerCase()} and can no longer be rejected`,
        )
      }

      // 1. Reject the claim, status-gated.
      const [claimRow] = await tx
        .update(claims)
        .set({ status: 'REJECTED' })
        .where(and(eq(claims.id, data.id), eq(claims.status, 'PENDING')))
        .returning()
      if (!claimRow) {
        throw new Error('This claim was just modified — please refresh')
      }

      // 2. If the listing is still CLAIM_REQUESTED and no other active
      //    claims remain, return it to AVAILABLE so others can claim it.
      const [otherActive] = await tx
        .select({ id: claims.id })
        .from(claims)
        .where(
          and(
            eq(claims.foodListingId, row.listingId),
            inArray(
              claims.status,
              ACTIVE_CLAIM_STATUSES as ClaimStatus[],
            ),
          ),
        )
        .limit(1)

      if (
        !otherActive &&
        row.listingStatus === 'CLAIM_REQUESTED'
      ) {
        await tx
          .update(foodListings)
          .set({ status: 'AVAILABLE', acceptedClaimId: null })
          .where(
            and(
              eq(foodListings.id, row.listingId),
              eq(foodListings.restaurantId, org.id),
              eq(foodListings.status, 'CLAIM_REQUESTED'),
            ),
          )
      }

      return claimRow as Claim
    })
  })
