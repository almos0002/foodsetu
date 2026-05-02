import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth, pool } from './auth'
import { safeExpireOldListings } from './expiry-server'
import {
  REPORT_STATUSES,
  isValidReportStatus,
  reportStatusFromDb,
  reportStatusToDb,
} from './permissions'
import type { ReportReason, ReportStatus } from './permissions'

// ---------------------------------------------------------------------------
// Auth gate
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new Error('UNAUTHORIZED')
  const user = session.user as typeof session.user & { role?: string | null }
  if (user.role !== 'ADMIN') throw new Error('FORBIDDEN')
  return user
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export type AdminStats = {
  totalUsers: number
  totalRestaurants: number
  totalNgos: number
  totalAnimalRescues: number
  activeListings: number
  completedPickups: number
  expiredListings: number
  pendingVerificationRequests: number
  rescuedFoodByUnit: { unit: string; total: number }[]
}

function toInt(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}
function toFloat(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

export const getAdminStatsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminStats> => {
    await requireAdmin()
    // Single round-trip: one query per stat is fine here (each is a fast
    // index-friendly count). Could be a UNION ALL if scale grows.
    const [
      totalUsers,
      orgCounts,
      activeListings,
      completedPickups,
      expiredListings,
      pendingVerification,
      rescuedByUnit,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM "user"`),
      pool.query(
        `SELECT type, COUNT(*)::int AS n FROM "organization" GROUP BY type`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM food_listings
          WHERE status IN ('AVAILABLE','CLAIM_REQUESTED','CLAIMED')`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM food_listings WHERE status = 'PICKED_UP'`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM food_listings WHERE status = 'EXPIRED'`,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM "organization"
          WHERE "verificationStatus" = 'PENDING'`,
      ),
      pool.query(
        `SELECT quantity_unit AS unit, SUM(quantity) AS total
           FROM food_listings
          WHERE status = 'PICKED_UP'
          GROUP BY quantity_unit
          ORDER BY total DESC`,
      ),
    ])

    const orgByType = new Map<string, number>()
    for (const r of orgCounts.rows as { type: string | null; n: number }[]) {
      if (r.type) orgByType.set(r.type, toInt(r.n))
    }

    return {
      totalUsers: toInt(totalUsers.rows[0]?.n),
      totalRestaurants: orgByType.get('RESTAURANT') ?? 0,
      totalNgos: orgByType.get('NGO') ?? 0,
      totalAnimalRescues: orgByType.get('ANIMAL_RESCUE') ?? 0,
      activeListings: toInt(activeListings.rows[0]?.n),
      completedPickups: toInt(completedPickups.rows[0]?.n),
      expiredListings: toInt(expiredListings.rows[0]?.n),
      pendingVerificationRequests: toInt(pendingVerification.rows[0]?.n),
      rescuedFoodByUnit: (
        rescuedByUnit.rows as { unit: string; total: string | number }[]
      ).map((r) => ({ unit: r.unit, total: toFloat(r.total) })),
    }
  },
)

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type AdminUserRow = {
  id: string
  name: string | null
  email: string | null
  role: string | null
  emailVerified: boolean
  createdAt: string
  orgId: string | null
  orgName: string | null
  orgType: string | null
  orgVerificationStatus: string | null
}

export const listUsersForAdminFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminUserRow[]> => {
    await requireAdmin()
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u."emailVerified", u."createdAt",
              o.id   AS "orgId",
              o.name AS "orgName",
              o.type AS "orgType",
              o."verificationStatus" AS "orgVerificationStatus"
         FROM "user" u
         LEFT JOIN LATERAL (
           SELECT org.id, org.name, org.type, org."verificationStatus"
             FROM "member" m
             JOIN "organization" org ON org.id = m."organizationId"
            WHERE m."userId" = u.id AND m.role = 'owner'
            ORDER BY m."createdAt" ASC
            LIMIT 1
         ) o ON TRUE
        ORDER BY u."createdAt" DESC
        LIMIT 500`,
    )
    return rows as AdminUserRow[]
  },
)

// ---------------------------------------------------------------------------
// Listings (admin view)
// ---------------------------------------------------------------------------

export type AdminListingRow = {
  id: string
  title: string
  status: string
  foodCategory: string
  foodType: string
  quantity: string | number
  quantityUnit: string
  pickupStartTime: string
  pickupEndTime: string
  expiryTime: string
  createdAt: string
  imageUrl: string | null
  restaurantId: string
  restaurantName: string | null
  cityId: string | null
  cityName: string | null
  // Number of reports filed against this listing (any status). Drives the
  // "REPORTED" badge in the admin listings table per spec rule 4. Counted
  // as int so the JSON payload doesn't surface PostgreSQL's bigint string.
  reportCount: number
}

export const listListingsForAdminFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminListingRow[]> => {
    await requireAdmin()
    // Sweep stale rows so the admin's expired filter reflects current truth
    // without waiting for a cron. Throttled + error-swallowing.
    await safeExpireOldListings()
    const { rows } = await pool.query(
      `SELECT l.id, l.title, l.status, l.food_category AS "foodCategory",
              l.food_type AS "foodType", l.quantity, l.quantity_unit AS "quantityUnit",
              l.pickup_start_time AS "pickupStartTime",
              l.pickup_end_time   AS "pickupEndTime",
              l.expiry_time       AS "expiryTime",
              l.created_at        AS "createdAt",
              l.image_url         AS "imageUrl",
              l.restaurant_id     AS "restaurantId",
              o.name              AS "restaurantName",
              l.city_id           AS "cityId",
              c.name              AS "cityName",
              COALESCE(rc.n, 0)::int AS "reportCount"
         FROM food_listings l
         LEFT JOIN "organization" o ON o.id = l.restaurant_id
         LEFT JOIN cities c ON c.id = l.city_id
         LEFT JOIN (
           SELECT food_listing_id, COUNT(*)::int AS n
             FROM reports
            WHERE food_listing_id IS NOT NULL
            GROUP BY food_listing_id
         ) rc ON rc.food_listing_id = l.id
        ORDER BY l.created_at DESC
        LIMIT 500`,
    )
    return rows as AdminListingRow[]
  },
)

const ADMIN_CANCELABLE_LISTING_STATUSES = new Set([
  'DRAFT',
  'AVAILABLE',
  'CLAIM_REQUESTED',
  'CLAIMED',
  'REPORTED',
])

function validateListingIdInput(value: unknown): { id: string } {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || !v.id) throw new Error('id required')
  return { id: v.id }
}

export const adminCancelListingFn = createServerFn({ method: 'POST' })
  .inputValidator(validateListingIdInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      // Lock + read current state
      const { rows: lrows } = await client.query(
        `SELECT id, status FROM food_listings WHERE id = $1 FOR UPDATE`,
        [data.id],
      )
      if (lrows.length === 0) throw new Error('Listing not found')
      const current = lrows[0] as { id: string; status: string }
      if (!ADMIN_CANCELABLE_LISTING_STATUSES.has(current.status)) {
        throw new Error(
          `Listing can no longer be cancelled (status: ${current.status})`,
        )
      }
      // Move any active claim on this listing to CANCELLED so the active-claim
      // unique index is freed and the claimant sees it disappear from active.
      await client.query(
        `UPDATE claims
            SET status = 'CANCELLED', updated_at = NOW()
          WHERE food_listing_id = $1
            AND status IN ('PENDING','ACCEPTED','PICKED_UP')`,
        [data.id],
      )
      await client.query(
        `UPDATE food_listings
            SET status = 'CANCELLED',
                accepted_claim_id = NULL,
                updated_at = NOW()
          WHERE id = $1`,
        [data.id],
      )
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
    return { ok: true as const, id: data.id }
  })

// ---------------------------------------------------------------------------
// Claims (admin view)
// ---------------------------------------------------------------------------

export type AdminClaimRow = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  otpVerifiedAt: string | null
  listingId: string
  listingTitle: string | null
  listingStatus: string | null
  restaurantId: string | null
  restaurantName: string | null
  claimantOrgId: string
  claimantOrgName: string | null
  claimantOrgType: string | null
}

export const listClaimsForAdminFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminClaimRow[]> => {
    await requireAdmin()
    const { rows } = await pool.query(
      `SELECT cl.id, cl.status, cl.created_at AS "createdAt",
              cl.updated_at AS "updatedAt",
              cl.otp_verified_at AS "otpVerifiedAt",
              cl.food_listing_id AS "listingId",
              l.title AS "listingTitle",
              l.status AS "listingStatus",
              l.restaurant_id AS "restaurantId",
              ro.name AS "restaurantName",
              cl.claimant_org_id AS "claimantOrgId",
              co.name AS "claimantOrgName",
              co.type AS "claimantOrgType"
         FROM claims cl
         LEFT JOIN food_listings l ON l.id = cl.food_listing_id
         LEFT JOIN "organization" ro ON ro.id = l.restaurant_id
         LEFT JOIN "organization" co ON co.id = cl.claimant_org_id
        ORDER BY cl.created_at DESC
        LIMIT 500`,
    )
    return rows as AdminClaimRow[]
  },
)

// Admin claim cancellation:
//   - claim PENDING/ACCEPTED -> CANCELLED
//   - if the listing is held by this claim (CLAIM_REQUESTED / CLAIMED with
//     accepted_claim_id pointing here), restore it to AVAILABLE so others
//     can re-claim. Listings already PICKED_UP or otherwise terminal are
//     left alone.
//
// Conservative: PICKED_UP / COMPLETED claims (post-OTP) and already-terminal
// claims (REJECTED / CANCELLED) cannot be cancelled by admin -- those have
// real-world delivery consequences and need a different remediation path.
const ADMIN_CANCELABLE_CLAIM_STATUSES = new Set(['PENDING', 'ACCEPTED'])

export const adminCancelClaimFn = createServerFn({ method: 'POST' })
  .inputValidator(validateListingIdInput) // reuses { id: string } shape
  .handler(async ({ data }) => {
    await requireAdmin()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const { rows: crows } = await client.query(
        `SELECT id, status, food_listing_id AS "foodListingId"
           FROM claims WHERE id = $1 FOR UPDATE`,
        [data.id],
      )
      if (crows.length === 0) throw new Error('Claim not found')
      const claim = crows[0] as {
        id: string
        status: string
        foodListingId: string
      }
      if (!ADMIN_CANCELABLE_CLAIM_STATUSES.has(claim.status)) {
        throw new Error(
          `Claim can no longer be cancelled (status: ${claim.status})`,
        )
      }
      // Lock the listing too, so we can safely free it.
      const { rows: lrows } = await client.query(
        `SELECT id, status, accepted_claim_id AS "acceptedClaimId"
           FROM food_listings WHERE id = $1 FOR UPDATE`,
        [claim.foodListingId],
      )
      const listing = lrows[0] as
        | { id: string; status: string; acceptedClaimId: string | null }
        | undefined
      // Cancel the claim, status-gated so concurrent transitions lose safely.
      const { rowCount: claimUpdated } = await client.query(
        `UPDATE claims
            SET status = 'CANCELLED', updated_at = NOW()
          WHERE id = $1
            AND status = ANY($2::claim_status[])`,
        [data.id, ['PENDING', 'ACCEPTED']],
      )
      if (claimUpdated === 0) {
        throw new Error('This claim was just modified — please refresh')
      }
      // Free the listing if it was held by this claim.
      if (
        listing &&
        (listing.status === 'CLAIM_REQUESTED' ||
          listing.status === 'CLAIMED') &&
        (listing.acceptedClaimId === data.id ||
          listing.status === 'CLAIM_REQUESTED')
      ) {
        await client.query(
          `UPDATE food_listings
              SET status = 'AVAILABLE',
                  accepted_claim_id = NULL,
                  updated_at = NOW()
            WHERE id = $1`,
          [claim.foodListingId],
        )
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
    return { ok: true as const, id: data.id }
  })

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
//
// Report enums (REPORT_STATUSES, REPORT_REASONS, ReportStatus, ReportReason)
// are defined in src/lib/permissions.ts and re-exported below for callers
// that import from `admin-server` for backward compatibility.
//
// IMPORTANT: the user-facing `REPORT_STATUSES` constant has 3 values
// (OPEN, REVIEWED, RESOLVED) but the underlying PG enum has 4 values
// including a legacy DISMISSED. Always translate via `reportStatusToDb`
// / `reportStatusFromDb` when crossing the DB boundary.

export { REPORT_STATUSES }
export type { ReportStatus, ReportReason }

export type AdminReportRow = {
  id: string
  status: ReportStatus
  reason: ReportReason
  description: string | null
  createdAt: string
  resolvedAt: string | null
  listingId: string | null
  listingTitle: string | null
  listingStatus: string | null
  claimId: string | null
  reporterId: string
  reporterName: string | null
  reporterEmail: string | null
  reporterOrgName: string | null
}

export const listReportsForAdminFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminReportRow[]> => {
    await requireAdmin()
    const { rows } = await pool.query(
      `SELECT r.id, r.status, r.reason, r.description, r.created_at AS "createdAt",
              r.resolved_at AS "resolvedAt",
              r.food_listing_id AS "listingId",
              l.title  AS "listingTitle",
              l.status AS "listingStatus",
              r.claim_id AS "claimId",
              r.reporter_id AS "reporterId",
              u.name  AS "reporterName",
              u.email AS "reporterEmail",
              ro.name AS "reporterOrgName"
         FROM reports r
         LEFT JOIN food_listings l ON l.id = r.food_listing_id
         LEFT JOIN "user" u ON u.id = r.reporter_id
         LEFT JOIN "organization" ro ON ro.id = r.reporter_org_id
        ORDER BY r.created_at DESC
        LIMIT 500`,
    )
    return (rows as Array<Record<string, unknown>>).map((raw) => {
      const r = raw as Omit<AdminReportRow, 'status'> & { status: string }
      return { ...r, status: reportStatusFromDb(r.status) }
    })
  },
)

function validateReportStatusInput(value: unknown): {
  id: string
  status: ReportStatus
} {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || !v.id) throw new Error('id required')
  if (!isValidReportStatus(v.status)) throw new Error('Invalid status')
  return { id: v.id, status: v.status }
}

export const setReportStatusFn = createServerFn({ method: 'POST' })
  .inputValidator(validateReportStatusInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    const dbStatus = reportStatusToDb(data.status)
    // `resolved_at` semantics:
    //   - Going to RESOLVED: stamp NOW() only on the *first* transition
    //     (preserve any existing closure timestamp on idempotent
    //     re-resolves so we don't rewrite history when an admin clicks
    //     Resolve a second time).
    //   - Going to OPEN/REVIEWED: clear the timestamp — the report is
    //     no longer closed.
    //   - Legacy DISMISSED rows surface as RESOLVED in the UI but the DB
    //     still holds 'DISMISSED'; we treat them as terminal for the
    //     "preserve existing timestamp" rule (`status IN (...)`).
    const result = await pool.query(
      `UPDATE reports
          SET status = $1::report_status,
              resolved_at = CASE
                WHEN $1::report_status = 'RESOLVED' THEN
                  CASE
                    WHEN status IN ('RESOLVED', 'DISMISSED')
                         AND resolved_at IS NOT NULL
                      THEN resolved_at
                    ELSE NOW()
                  END
                ELSE NULL
              END,
              updated_at = NOW()
        WHERE id = $2
        RETURNING id, status`,
      [dbStatus, data.id],
    )
    if (result.rowCount === 0) throw new Error('Report not found')
    return {
      ok: true as const,
      id: result.rows[0].id as string,
      status: reportStatusFromDb(result.rows[0].status as string),
    }
  })

// ---------------------------------------------------------------------------
// Cities
// ---------------------------------------------------------------------------

export type AdminCityRow = {
  id: string
  name: string
  state: string
  country: string
  slug: string
  latitude: string | number | null
  longitude: string | number | null
  isActive: boolean
  createdAt: string
}

export const listCitiesForAdminFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminCityRow[]> => {
    await requireAdmin()
    const { rows } = await pool.query(
      `SELECT id, name, state, country, slug, latitude, longitude,
              is_active AS "isActive", created_at AS "createdAt"
         FROM cities
        ORDER BY state ASC, name ASC`,
    )
    return rows as AdminCityRow[]
  },
)

function slugify(name: string, state: string): string {
  const base = `${name}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return base.slice(0, 80) || 'city'
}

type CityInput = {
  name: string
  state: string
  country: string
  latitude: number | null
  longitude: number | null
  isActive: boolean
}

function validateCityInput(value: unknown): CityInput {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  const name = typeof v.name === 'string' ? v.name.trim() : ''
  const state = typeof v.state === 'string' ? v.state.trim() : ''
  if (name.length < 1 || name.length > 120) throw new Error('Name required')
  if (state.length < 1 || state.length > 120) throw new Error('State required')
  const country =
    typeof v.country === 'string' && v.country.trim().length > 0
      ? v.country.trim().slice(0, 2).toUpperCase()
      : 'NP'
  const optNum = (k: string) => {
    const x = v[k]
    if (x === undefined || x === null || x === '') return null
    const n = typeof x === 'number' ? x : Number(x)
    if (!Number.isFinite(n)) throw new Error(`${k} must be a number`)
    return n
  }
  const latitude = optNum('latitude')
  const longitude = optNum('longitude')
  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    throw new Error('Latitude out of range')
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    throw new Error('Longitude out of range')
  }
  return {
    name,
    state,
    country,
    latitude,
    longitude,
    isActive: v.isActive !== false,
  }
}

export const createCityFn = createServerFn({ method: 'POST' })
  .inputValidator(validateCityInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    const slug = `${slugify(data.name, data.state)}-${crypto
      .randomUUID()
      .slice(0, 6)}`
    const id = crypto.randomUUID()
    const { rows } = await pool.query(
      `INSERT INTO cities
         (id, name, state, country, slug, latitude, longitude, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        id,
        data.name,
        data.state,
        data.country,
        slug,
        data.latitude,
        data.longitude,
        data.isActive,
      ],
    )
    return { ok: true as const, id: rows[0].id as string }
  })

function validateCityUpdateInput(value: unknown): CityInput & { id: string } {
  const base = validateCityInput(value)
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || !v.id) throw new Error('id required')
  return { ...base, id: v.id }
}

export const updateCityFn = createServerFn({ method: 'POST' })
  .inputValidator(validateCityUpdateInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    const result = await pool.query(
      `UPDATE cities
          SET name = $1, state = $2, country = $3,
              latitude = $4, longitude = $5,
              is_active = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING id`,
      [
        data.name,
        data.state,
        data.country,
        data.latitude,
        data.longitude,
        data.isActive,
        data.id,
      ],
    )
    if (result.rowCount === 0) throw new Error('City not found')
    return { ok: true as const, id: data.id }
  })

function validateToggleInput(value: unknown): {
  id: string
  isActive: boolean
} {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  if (typeof v.id !== 'string' || !v.id) throw new Error('id required')
  if (typeof v.isActive !== 'boolean') throw new Error('isActive required')
  return { id: v.id, isActive: v.isActive }
}

export const toggleCityActiveFn = createServerFn({ method: 'POST' })
  .inputValidator(validateToggleInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    const result = await pool.query(
      `UPDATE cities
          SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id`,
      [data.isActive, data.id],
    )
    if (result.rowCount === 0) throw new Error('City not found')
    return { ok: true as const, id: data.id, isActive: data.isActive }
  })
