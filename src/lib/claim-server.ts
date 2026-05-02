import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, eq, sql } from 'drizzle-orm'
import { auth, pool } from './auth'
import { db } from '../db'
import { claims, foodListings, type Claim } from '../db/schema'

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

/**
 * Returns the verified NGO org owned by the caller, or throws a user-facing
 * error. ADMIN bypasses the verification gate but still needs to own an NGO
 * org (admins act on behalf of a specific NGO — no magic claimantOrgId).
 */
async function requireVerifiedNgoOrg(
  user: SessionUser,
): Promise<OwnerOrgRow> {
  const org = await fetchOwnerOrgForUser(user.id)
  if (!org) throw new Error('You must set up your organization first')
  if (org.type !== 'NGO') {
    throw new Error('Only NGOs can claim human-safe food')
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
// Public types
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
  // `listMyClaimsFn` after status transitions to ACCEPTED/PICKED_UP.
  cityName: string | null
  // null if the NGO has no location set.
  distanceKm: number | null
}

export type MyClaim = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  pickupTime: string | null
  notes: string | null
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

const PHONE_VISIBLE_CLAIM_STATUSES = new Set(['ACCEPTED', 'PICKED_UP'])

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
// Server functions
// ---------------------------------------------------------------------------

/**
 * Returns AVAILABLE + HUMAN_SAFE listings whose pickup window and expiry are
 * still in the future, enriched with restaurant info and the great-circle
 * distance from the NGO's organization location. Sorted by distance ascending
 * (nulls last) then expiry ascending. Caller must own a verified NGO org.
 */
export const listNearbyHumanFoodFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireSessionUser()
    const org = await fetchOwnerOrgForUser(user.id)
    // Hide the feed entirely for non-NGO callers (mirrors the role gate in
    // routes). Avoids accidental data exposure if the route guard is bypassed.
    if (!org || org.type !== 'NGO') return [] as NearbyListing[]
    if (user.role !== 'ADMIN' && org.verificationStatus !== 'VERIFIED') {
      return [] as NearbyListing[]
    }

    // NOTE: `o.phone` is intentionally NOT selected — restaurant contact is
    // gated behind an accepted claim (see `listMyClaimsFn`).
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
        WHERE fl.food_category = 'HUMAN_SAFE'
          AND fl.status = 'AVAILABLE'
          AND fl.expiry_time > NOW()
          AND fl.pickup_end_time > NOW()
        LIMIT 200`,
    )

    const ngoLat = org.latitude
    const ngoLng = org.longitude

    const enriched: NearbyListing[] = rows.map((r) => {
      const lat = Number(r.latitude)
      const lng = Number(r.longitude)
      const distanceKm =
        ngoLat != null && ngoLng != null
          ? haversineKm(ngoLat, ngoLng, lat, lng)
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
  },
)

/** Lists the NGO's own claims (newest first), with denormalized listing info. */
export const listMyClaimsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await requireSessionUser()
    const org = await fetchOwnerOrgForUser(user.id)
    if (!org || org.type !== 'NGO') return [] as MyClaim[]

    const { rows } = await pool.query(
      `SELECT cl.id, cl.status, cl.created_at, cl.updated_at,
              cl.pickup_time, cl.notes,
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
  },
)

/**
 * NGO claims a listing.
 *
 * Atomicity (single transaction):
 * 1. Update the listing AVAILABLE → CLAIM_REQUESTED, gated on category=HUMAN_SAFE
 *    and status=AVAILABLE. If no row matches, the listing is already taken,
 *    cancelled, expired, or doesn't exist. The status check + UPDATE in one
 *    statement is the race guard.
 * 2. Insert a PENDING claim. The partial unique index
 *    `claims_listing_active_uq` on (food_listing_id) WHERE status IN
 *    ('PENDING','ACCEPTED','PICKED_UP') is the secondary guard against
 *    multiple active claims on the same listing.
 *
 * If anything throws, the transaction rolls back and the listing reverts.
 */
export const createClaimFn = createServerFn({ method: 'POST' })
  .inputValidator(validateIdInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await requireVerifiedNgoOrg(user)

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
            eq(foodListings.foodCategory, 'HUMAN_SAFE'),
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
        if (existing.foodCategory !== 'HUMAN_SAFE') {
          throw new Error('Only human-safe food can be claimed by NGOs')
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
  })
