import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { auth, pool } from './auth'
import { db } from '../db'
import { foodListings, type FoodListing } from '../db/schema'
import { safeExpireOldListings } from './expiry-server'
import { notifyFoodListingCreated } from './notification-server'
import {
  ACTIVE_LISTING_STATUSES,
  CANCELABLE_LISTING_STATUSES,
  EDITABLE_LISTING_STATUSES,
  FOOD_CATEGORIES,
  FOOD_TYPES,
  HISTORY_LISTING_STATUSES,
  QUANTITY_UNITS,
  type FoodCategory,
  type FoodType,
  type ListingStatus,
  type QuantityUnit,
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
    `SELECT o.id, o.type, o."verificationStatus", o."cityId",
            o.latitude, o.longitude
       FROM "organization" o
       JOIN "member" m ON m."organizationId" = o.id
      WHERE m."userId" = $1 AND m.role = 'owner'
      LIMIT 1`,
    [userId],
  )
  return (rows[0] as OwnerOrgRow | undefined) ?? null
}

/**
 * Returns the verified RESTAURANT org owned by the caller, or throws a
 * user-facing error. ADMIN bypasses the verification gate but still needs to
 * own a RESTAURANT org to create restaurant listings (so they can act on
 * behalf of a specific restaurant — admins do not get a magic restaurantId).
 */
async function requireVerifiedRestaurantOrg(
  user: SessionUser,
): Promise<OwnerOrgRow> {
  const org = await fetchOwnerOrgForUser(user.id)
  if (!org) throw new Error('You must set up your organization first')
  if (org.type !== 'RESTAURANT') {
    throw new Error('Only restaurants can manage food listings')
  }
  if (user.role !== 'ADMIN' && org.verificationStatus !== 'VERIFIED') {
    throw new Error('Your organization must be verified before posting listings')
  }
  return org
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const MAX_TITLE = 200
const MAX_DESCRIPTION = 2000
const MAX_QUANTITY = 100000

export type ListingInput = {
  title: string
  description: string | null
  quantity: number
  quantityUnit: QuantityUnit
  foodCategory: FoodCategory
  foodType: FoodType
  pickupStartTime: string // ISO
  pickupEndTime: string // ISO
  expiryTime: string // ISO
  latitude: number
  longitude: number
  imageUrl: string | null
}

function asString(v: unknown, label: string, max: number, required = true): string | null {
  if (v === undefined || v === null || v === '') {
    if (required) throw new Error(`${label} is required`)
    return null
  }
  if (typeof v !== 'string') throw new Error(`${label} must be a string`)
  const trimmed = v.trim()
  if (required && trimmed.length === 0) throw new Error(`${label} is required`)
  if (trimmed.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer`)
  }
  return trimmed.length === 0 ? null : trimmed
}

function asNumber(v: unknown, label: string): number {
  if (v === undefined || v === null || v === '') {
    throw new Error(`${label} is required`)
  }
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) throw new Error(`${label} must be a number`)
  return n
}

function asEnum<T extends string>(
  v: unknown,
  label: string,
  allowed: readonly T[],
): T {
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
    throw new Error(
      `${label} must be one of: ${allowed.join(', ')}`,
    )
  }
  return v as T
}

function asIsoDate(v: unknown, label: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${label} is required`)
  }
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) {
    throw new Error(`${label} is not a valid date/time`)
  }
  return d.toISOString()
}

function asOptionalUrl(v: unknown, label: string): string | null {
  if (v === undefined || v === null || v === '') return null
  if (typeof v !== 'string') throw new Error(`${label} must be a string`)
  const trimmed = v.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > 2000) throw new Error(`${label} too long`)
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error(`${label} must be a valid URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${label} must use http or https`)
  }
  return parsed.toString()
}

function validateListingInput(value: unknown): ListingInput {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid listing data')
  }
  const v = value as Record<string, unknown>

  const title = asString(v.title, 'Title', MAX_TITLE) as string
  if (title.length < 2) throw new Error('Title must be at least 2 characters')
  const description = asString(v.description, 'Description', MAX_DESCRIPTION, false)

  const quantity = asNumber(v.quantity, 'Quantity')
  if (quantity <= 0) throw new Error('Quantity must be greater than zero')
  if (quantity > MAX_QUANTITY) throw new Error(`Quantity must be ${MAX_QUANTITY} or less`)

  const quantityUnit = asEnum(v.quantityUnit, 'Quantity unit', QUANTITY_UNITS)
  const foodCategory = asEnum(v.foodCategory, 'Food category', FOOD_CATEGORIES)
  const foodType = asEnum(v.foodType, 'Food type', FOOD_TYPES)

  const pickupStartTime = asIsoDate(v.pickupStartTime, 'Pickup start time')
  const pickupEndTime = asIsoDate(v.pickupEndTime, 'Pickup end time')
  const expiryTime = asIsoDate(v.expiryTime, 'Expiry time')

  const start = new Date(pickupStartTime).getTime()
  const end = new Date(pickupEndTime).getTime()
  const exp = new Date(expiryTime).getTime()
  if (end <= start) {
    throw new Error('Pickup end time must be after pickup start time')
  }
  if (exp <= start) {
    throw new Error('Expiry time must be after pickup start time')
  }

  const latitude = asNumber(v.latitude, 'Latitude')
  const longitude = asNumber(v.longitude, 'Longitude')
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90')
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180')
  }

  const imageUrl = asOptionalUrl(v.imageUrl, 'Image URL')

  return {
    title,
    description,
    quantity,
    quantityUnit,
    foodCategory,
    foodType,
    pickupStartTime,
    pickupEndTime,
    expiryTime,
    latitude,
    longitude,
    imageUrl,
  }
}

function validateUpdateInput(value: unknown): { id: string; data: ListingInput } {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || v.id.length === 0) {
    throw new Error('Listing id is required')
  }
  return { id: v.id, data: validateListingInput(v.data) }
}

function validateIdInput(value: unknown): { id: string } {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || v.id.length === 0) {
    throw new Error('Listing id is required')
  }
  return { id: v.id }
}

function validateListInput(value: unknown): { scope: 'active' | 'history' | 'all' } {
  const v = (value ?? {}) as Record<string, unknown>
  const scope =
    v.scope === 'active' || v.scope === 'history' || v.scope === 'all'
      ? v.scope
      : 'active'
  return { scope }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ListingRow = Omit<
  FoodListing,
  | 'quantity'
  | 'latitude'
  | 'longitude'
  | 'pickupStartTime'
  | 'pickupEndTime'
  | 'expiryTime'
  | 'createdAt'
  | 'updatedAt'
  | 'deliveredAt'
> & {
  quantity: number
  latitude: number
  longitude: number
  pickupStartTime: string
  pickupEndTime: string
  expiryTime: string
  createdAt: string
  updatedAt: string
  deliveredAt: string | null
}

function toListingRow(row: FoodListing): ListingRow {
  return {
    ...row,
    quantity: Number(row.quantity),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    pickupStartTime: row.pickupStartTime.toISOString(),
    pickupEndTime: row.pickupEndTime.toISOString(),
    expiryTime: row.expiryTime.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : null,
  }
}

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

export const listMyListingsFn = createServerFn({ method: 'GET' })
  .inputValidator(validateListInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await fetchOwnerOrgForUser(user.id)
    if (!org || org.type !== 'RESTAURANT') return [] as ListingRow[]

    // Sweep stale rows so the restaurant sees expired items move to history
    // immediately. Throttled + error-swallowing so a sweep failure never
    // breaks the listings page.
    await safeExpireOldListings()

    const statuses =
      data.scope === 'active'
        ? (ACTIVE_LISTING_STATUSES as readonly ListingStatus[])
        : data.scope === 'history'
          ? (HISTORY_LISTING_STATUSES as readonly ListingStatus[])
          : null

    const where = statuses
      ? and(
          eq(foodListings.restaurantId, org.id),
          inArray(foodListings.status, statuses as ListingStatus[]),
        )
      : eq(foodListings.restaurantId, org.id)

    const rows = await db
      .select()
      .from(foodListings)
      .where(where)
      .orderBy(desc(foodListings.createdAt))

    return rows.map(toListingRow)
  })

export const getMyListingFn = createServerFn({ method: 'GET' })
  .inputValidator(validateIdInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await fetchOwnerOrgForUser(user.id)
    if (!org || org.type !== 'RESTAURANT') {
      throw new Error('NOT_FOUND')
    }
    const [row] = await db
      .select()
      .from(foodListings)
      .where(
        and(
          eq(foodListings.id, data.id),
          eq(foodListings.restaurantId, org.id),
        ),
      )
      .limit(1)
    if (!row) throw new Error('NOT_FOUND')
    return toListingRow(row)
  })

export const createListingFn = createServerFn({ method: 'POST' })
  .inputValidator(validateListingInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await requireVerifiedRestaurantOrg(user)

    const [row] = await db
      .insert(foodListings)
      .values({
        restaurantId: org.id,
        createdById: user.id,
        cityId: org.cityId ?? null,
        title: data.title,
        description: data.description,
        // numeric columns accept strings in node-postgres bindings
        quantity: data.quantity.toString(),
        quantityUnit: data.quantityUnit,
        foodCategory: data.foodCategory,
        foodType: data.foodType,
        pickupStartTime: new Date(data.pickupStartTime),
        pickupEndTime: new Date(data.pickupEndTime),
        expiryTime: new Date(data.expiryTime),
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        status: 'AVAILABLE',
        imageUrl: data.imageUrl,
      })
      .returning()

    // Fire-and-forget notification fan-out to potential claimants. Errors
    // are swallowed inside the notifier so a logging blip never blocks the
    // restaurant's create flow.
    void notifyFoodListingCreated({
      id: row.id,
      title: row.title,
      quantity: Number(row.quantity),
      quantityUnit: row.quantityUnit,
      foodCategory: row.foodCategory,
      pickupStartTime: row.pickupStartTime,
      pickupEndTime: row.pickupEndTime,
      restaurantId: row.restaurantId,
    })

    return toListingRow(row)
  })

export const updateListingFn = createServerFn({ method: 'POST' })
  .inputValidator(validateUpdateInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await requireVerifiedRestaurantOrg(user)

    // Atomic update gated by ownership + editable status. If no row matches,
    // the listing either doesn't exist, isn't ours, or isn't editable.
    const [row] = await db
      .update(foodListings)
      .set({
        title: data.data.title,
        description: data.data.description,
        quantity: data.data.quantity.toString(),
        quantityUnit: data.data.quantityUnit,
        foodCategory: data.data.foodCategory,
        foodType: data.data.foodType,
        pickupStartTime: new Date(data.data.pickupStartTime),
        pickupEndTime: new Date(data.data.pickupEndTime),
        expiryTime: new Date(data.data.expiryTime),
        latitude: data.data.latitude.toString(),
        longitude: data.data.longitude.toString(),
        imageUrl: data.data.imageUrl,
      })
      .where(
        and(
          eq(foodListings.id, data.id),
          eq(foodListings.restaurantId, org.id),
          inArray(
            foodListings.status,
            EDITABLE_LISTING_STATUSES as ListingStatus[],
          ),
        ),
      )
      .returning()

    if (!row) {
      // Disambiguate so the user knows whether it's a permission or a status issue.
      const [existing] = await db
        .select({ status: foodListings.status, restaurantId: foodListings.restaurantId })
        .from(foodListings)
        .where(eq(foodListings.id, data.id))
        .limit(1)
      if (!existing || existing.restaurantId !== org.id) {
        throw new Error('Listing not found')
      }
      throw new Error(
        `Listings in status ${existing.status} can no longer be edited`,
      )
    }
    return toListingRow(row)
  })

export const cancelListingFn = createServerFn({ method: 'POST' })
  .inputValidator(validateIdInput)
  .handler(async ({ data }) => {
    const user = await requireSessionUser()
    const org = await requireVerifiedRestaurantOrg(user)

    const [row] = await db
      .update(foodListings)
      .set({ status: 'CANCELLED' })
      .where(
        and(
          eq(foodListings.id, data.id),
          eq(foodListings.restaurantId, org.id),
          inArray(
            foodListings.status,
            CANCELABLE_LISTING_STATUSES as ListingStatus[],
          ),
        ),
      )
      .returning()

    if (!row) {
      const [existing] = await db
        .select({ status: foodListings.status, restaurantId: foodListings.restaurantId })
        .from(foodListings)
        .where(eq(foodListings.id, data.id))
        .limit(1)
      if (!existing || existing.restaurantId !== org.id) {
        throw new Error('Listing not found')
      }
      throw new Error(
        `Listings in status ${existing.status} cannot be cancelled`,
      )
    }
    return toListingRow(row)
  })
