import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { randomUUID } from 'node:crypto'
import { auth, pool } from './auth'
import {
  REPORT_REASONS,
  isValidReportReason,
  reportStatusFromDb,
} from './permissions'
import type { ReportReason, ReportStatus } from './permissions'

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function requireSessionUser() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new Error('UNAUTHORIZED')
  return session.user as typeof session.user & { role?: string | null }
}

async function fetchOwnerOrgIdForUser(
  userId: string,
): Promise<{ id: string; type: string | null } | null> {
  const { rows } = await pool.query(
    `SELECT org.id, org.type
       FROM "member" m
       JOIN "organization" org ON org.id = m."organizationId"
      WHERE m."userId" = $1 AND m.role = 'owner'
      ORDER BY m."createdAt" ASC
      LIMIT 1`,
    [userId],
  )
  if (rows.length === 0) return null
  return rows[0] as { id: string; type: string | null }
}

// ---------------------------------------------------------------------------
// Create report
// ---------------------------------------------------------------------------

const DESCRIPTION_MAX_LEN = 2000

type CreateReportInput = {
  reason: ReportReason
  description: string | null
  foodListingId: string | null
  claimId: string | null
}

function validateCreateReportInput(value: unknown): CreateReportInput {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  if (!isValidReportReason(v.reason)) {
    throw new Error('Pick a reason for the report.')
  }
  const reason = v.reason

  let description: string | null = null
  if (typeof v.description === 'string' && v.description.trim()) {
    description = v.description.trim().slice(0, DESCRIPTION_MAX_LEN)
  }
  // OTHER must include a description so the admin has something to act on.
  if (reason === 'OTHER' && !description) {
    throw new Error('Please describe the issue when reason is "Other".')
  }

  const foodListingId =
    typeof v.foodListingId === 'string' && v.foodListingId
      ? v.foodListingId
      : null
  const claimId = typeof v.claimId === 'string' && v.claimId ? v.claimId : null

  return { reason, description, foodListingId, claimId }
}

export type CreateReportResult = {
  ok: true
  id: string
}

export const createReportFn = createServerFn({ method: 'POST' })
  .inputValidator(validateCreateReportInput)
  .handler(async ({ data }): Promise<CreateReportResult> => {
    const user = await requireSessionUser()
    const ownerOrg = await fetchOwnerOrgIdForUser(user.id)

    // If the report is tied to a listing, verify the listing exists. We use
    // the existence check (rather than trusting the client) so we can both
    // (a) reject ghost IDs early with a friendly error, and (b) avoid an
    // unnecessary FK violation surfacing as a 500.
    if (data.foodListingId) {
      const { rowCount } = await pool.query(
        `SELECT 1 FROM food_listings WHERE id = $1`,
        [data.foodListingId],
      )
      if (rowCount === 0) {
        throw new Error('That listing no longer exists.')
      }
    }

    // Same defensive check for claimId. Two integrity rules apply:
    //   (a) If the caller supplies a claimId without a listingId, derive
    //       the listingId from the claim so owner-side visibility (rule 3)
    //       still routes the report to the correct listing owner.
    //   (b) If the caller supplies BOTH and they don't match, reject.
    //       Otherwise a mismatched pair could (mis)route visibility to
    //       both the wrong listing owner and the right claim org, which
    //       is an authorization-surface bug, not just a UI cosmetic.
    let listingIdToInsert = data.foodListingId
    if (data.claimId) {
      const { rows } = await pool.query(
        `SELECT food_listing_id AS "foodListingId" FROM claims WHERE id = $1`,
        [data.claimId],
      )
      if (rows.length === 0) {
        throw new Error('That claim no longer exists.')
      }
      const claim = rows[0] as { foodListingId: string }
      if (!listingIdToInsert) {
        listingIdToInsert = claim.foodListingId
      } else if (listingIdToInsert !== claim.foodListingId) {
        throw new Error(
          'The claim does not belong to that listing — refresh and try again.',
        )
      }
    }

    // Generate the id explicitly: the schema helper's `$defaultFn` only fires
    // when inserts go through the Drizzle ORM, but this path uses raw
    // `pool.query`, so Postgres would otherwise see a null id and reject.
    const reportId = randomUUID()
    const { rows } = await pool.query(
      `INSERT INTO reports
         (id, food_listing_id, claim_id, reporter_id, reporter_org_id,
          reason, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
       RETURNING id`,
      [
        reportId,
        listingIdToInsert,
        data.claimId,
        user.id,
        ownerOrg?.id ?? null,
        data.reason,
        data.description,
      ],
    )
    return { ok: true as const, id: rows[0].id as string }
  })

// ---------------------------------------------------------------------------
// Visible reports for the caller (rule 3)
// ---------------------------------------------------------------------------

export type VisibleReport = {
  id: string
  reason: ReportReason
  status: ReportStatus
  description: string | null
  createdAt: string
  resolvedAt: string | null
  // Reporter info — visible to the caller in two cases: they filed it
  // themselves (so they already know), or they're the listing owner /
  // claimant org and the reporter info helps them respond.
  reporterId: string
  reporterName: string | null
  reporterOrgName: string | null
  // Linked listing (may be null for generic reports).
  listingId: string | null
  listingTitle: string | null
  listingStatus: string | null
  // Linked claim (may be null).
  claimId: string | null
  // Why the caller can see this report — drives the small "context" pill
  // in the UI.
  visibility: 'FILED_BY_ME' | 'ABOUT_MY_LISTING' | 'ABOUT_MY_CLAIM'
}

export const listMyVisibleReportsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<VisibleReport[]> => {
    const user = await requireSessionUser()
    const ownerOrg = await fetchOwnerOrgIdForUser(user.id)
    const orgId = ownerOrg?.id ?? null

    // Three-way visibility:
    //   1. The caller filed it (`reporter_id = $userId`).
    //   2. The caller's org owns the listing (`l.restaurant_id = $orgId`).
    //   3. The caller's org filed a claim referenced by the report
    //      (`cl.claimant_org_id = $orgId`).
    // We compute a `visibility` discriminator with priority FILED_BY_ME >
    // ABOUT_MY_LISTING > ABOUT_MY_CLAIM so a caller who filed their own
    // report sees it labelled as "Filed by you" not "About your listing".
    const { rows } = await pool.query(
      `SELECT r.id,
              r.reason,
              r.status,
              r.description,
              r.created_at  AS "createdAt",
              r.resolved_at AS "resolvedAt",
              r.reporter_id AS "reporterId",
              u.name        AS "reporterName",
              ro.name       AS "reporterOrgName",
              r.food_listing_id AS "listingId",
              l.title       AS "listingTitle",
              l.status      AS "listingStatus",
              r.claim_id    AS "claimId",
              CASE
                WHEN r.reporter_id = $1 THEN 'FILED_BY_ME'
                WHEN l.restaurant_id IS NOT NULL
                     AND $2::text IS NOT NULL
                     AND l.restaurant_id = $2 THEN 'ABOUT_MY_LISTING'
                WHEN cl.claimant_org_id IS NOT NULL
                     AND $2::text IS NOT NULL
                     AND cl.claimant_org_id = $2 THEN 'ABOUT_MY_CLAIM'
                ELSE NULL
              END AS "visibility"
         FROM reports r
         LEFT JOIN food_listings l ON l.id = r.food_listing_id
         LEFT JOIN claims cl       ON cl.id = r.claim_id
         LEFT JOIN "user" u        ON u.id = r.reporter_id
         LEFT JOIN "organization" ro ON ro.id = r.reporter_org_id
        WHERE r.reporter_id = $1
           OR ($2::text IS NOT NULL AND l.restaurant_id = $2)
           OR ($2::text IS NOT NULL AND cl.claimant_org_id = $2)
        ORDER BY r.created_at DESC
        LIMIT 200`,
      [user.id, orgId],
    )

    return (rows as Array<Record<string, unknown>>).map((raw) => {
      const r = raw as {
        id: string
        reason: ReportReason
        status: string
        description: string | null
        createdAt: string
        resolvedAt: string | null
        reporterId: string
        reporterName: string | null
        reporterOrgName: string | null
        listingId: string | null
        listingTitle: string | null
        listingStatus: string | null
        claimId: string | null
        visibility: VisibleReport['visibility'] | null
      }
      // The CASE returned NULL for callers who matched none of the three
      // predicates, but the WHERE clause would have excluded those rows.
      // Default to FILED_BY_ME to make TypeScript's narrowing happy
      // without lying about visibility — a NULL here is impossible in
      // practice (would mean the row passed the WHERE without matching
      // any branch).
      return {
        ...r,
        status: reportStatusFromDb(r.status),
        visibility: r.visibility ?? 'FILED_BY_ME',
      }
    })
  },
)

// ---------------------------------------------------------------------------
// Re-export so callers don't need a second import for the enum list
// ---------------------------------------------------------------------------

export { REPORT_REASONS }
