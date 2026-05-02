import { pool } from './auth'

/**
 * Sweeps food listings whose `expiry_time` has passed and transitions them
 * to `EXPIRED`.
 *
 * Status transitions (single SQL statement, atomic):
 *   - `AVAILABLE`        + expired                       → `EXPIRED`
 *   - `CLAIM_REQUESTED`  + expired (only PENDING claim)  → `EXPIRED`
 *                                                          + the PENDING
 *                                                            claim moves to
 *                                                            `CANCELLED`,
 *                                                            freeing the
 *                                                            `claims_listing_active_uq`
 *                                                            partial unique
 *                                                            index.
 *   - `CLAIMED`          + expired (claim already ACCEPTED) → left alone.
 *                                                            The pickup
 *                                                            handoff continues
 *                                                            as planned.
 *   - `DRAFT`            + expired → left alone (never published).
 *   - terminal (`PICKED_UP`, `EXPIRED`, `CANCELLED`, `REPORTED`) → unchanged.
 *
 * Implementation notes:
 *   - Uses a writable CTE so the listing UPDATE and the dependent claim
 *     UPDATE happen in a single statement (one snapshot, atomic). No
 *     explicit BEGIN/COMMIT needed.
 *   - The CTE returns counts so callers / monitoring can see what happened.
 *   - Set-based; idempotent. Safe to invoke from multiple concurrent
 *     requests — at worst the statements race and one becomes a no-op.
 */
export async function expireOldListings(): Promise<{
  expiredListings: number
  cancelledClaims: number
}> {
  const { rows } = await pool.query(
    `WITH expired AS (
       UPDATE food_listings
          SET status = 'EXPIRED', updated_at = NOW()
        WHERE status IN ('AVAILABLE', 'CLAIM_REQUESTED')
          AND expiry_time <= NOW()
        RETURNING id
     ),
     cancelled AS (
       UPDATE claims
          SET status = 'CANCELLED', updated_at = NOW()
        WHERE food_listing_id IN (SELECT id FROM expired)
          AND status = 'PENDING'
        RETURNING id
     )
     SELECT
       (SELECT COUNT(*)::int FROM expired)   AS expired_listings,
       (SELECT COUNT(*)::int FROM cancelled) AS cancelled_claims`,
  )
  const r = rows[0] as { expired_listings: number; cancelled_claims: number }
  return {
    expiredListings: r?.expired_listings ?? 0,
    cancelledClaims: r?.cancelled_claims ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Throttled, fire-and-forget wrapper for hot-path callers (page loads).
// ---------------------------------------------------------------------------

const THROTTLE_MS = 30_000
let lastSweepAt = 0
let inFlight: Promise<void> | null = null

/**
 * Best-effort variant suitable for invocation from page-load server fns.
 *
 *   - Throttles to once every {@link THROTTLE_MS} per server instance so a
 *     burst of page loads doesn't trigger a write storm.
 *   - Coalesces concurrent calls onto a single in-flight promise so two
 *     simultaneous loaders share one sweep instead of racing.
 *   - Swallows errors and logs them — a sweep failure must never block the
 *     page render. Callers can still call {@link expireOldListings} directly
 *     if they need to surface failures (e.g. a future cron job).
 */
export async function safeExpireOldListings(): Promise<void> {
  const now = Date.now()
  if (now - lastSweepAt < THROTTLE_MS) return
  if (inFlight) return inFlight

  lastSweepAt = now
  inFlight = (async () => {
    try {
      await expireOldListings()
    } catch (err) {
      console.error('[expiry] expireOldListings failed', err)
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}
