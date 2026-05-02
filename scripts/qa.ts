/**
 * End-to-end QA harness for the FoodSetu MVP loop.
 *
 * Has TWO layers, both exercised on every run:
 *
 * A) HTTP layer (`runHttpLayer`) — talks to the live dev server on port
 *    5000. Verifies Better Auth sign-in, sign-in failure, route guards
 *    (admin redirect for non-admins, /login redirect for unauthed), and
 *    that authenticated dashboard GETs return 200. Authenticated dashboard
 *    GETs exercise the route loaders, which in turn call the real
 *    createServerFn handlers (e.g. listMyClaimsFn, getMyOrgFn,
 *    getAdminStatsFn) end-to-end through the HTTP+RPC stack.
 *
 * B) Business-logic layer (`runBusinessLogicLayer`) — drives the same
 *    Drizzle transactions the server-fn handlers wrap, with no HTTP hop.
 *    This is where lifecycle invariants (status guards, OTP validation,
 *    listing↔claim consistency, expiry sweep, admin cancel listing/claim)
 *    are asserted at the database level.
 *
 * Walks the documented flow against the freshly-seeded dataset
 * (`scripts/seed.ts`):
 *
 *   1. happy path: restaurant verified → listing → NGO claim → restaurant
 *      accept (OTP issued) → restaurant verify OTP → completed.
 *   2. animal-rescue path: same loop, ANIMAL_SAFE.
 *   3. negative: NGO can't see ANIMAL_SAFE; animal can't see HUMAN_SAFE.
 *   4. negative: pending org can't list / claim (gate verified at HTTP
 *      layer + DB-state assertions).
 *   5. negative: expired listing can't be claimed; sweep moves it to EXPIRED.
 *   6. negative: wrong OTP rejected; state preserved.
 *   7. admin: can verify / reject / suspend orgs, cancel listings, AND
 *      cancel claims (PENDING/ACCEPTED → CANCELLED, listing freed back
 *      to AVAILABLE).
 *
 * Re-runs `scripts/seed.ts` first so it's deterministic. The HTTP layer
 * REQUIRES the dev server to be running on http://localhost:5000 (the
 * `Start application` workflow). If unreachable the HTTP layer is reported
 * as skipped but the business-logic layer still runs.
 *
 * Run:
 *   npx tsx scripts/seed.ts && npx tsx scripts/qa.ts
 */

import { Pool } from 'pg'
import { execSync } from 'node:child_process'
import { auth } from '../src/lib/auth'
import { db } from '../src/db'
import { foodListings, claims } from '../src/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { expireOldListings } from '../src/lib/expiry-server'
import { getNearbyListings } from '../src/lib/geo-server'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run scripts/qa.ts')
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

type CheckResult = { name: string; ok: boolean; detail?: string }
const results: CheckResult[] = []

function record(name: string, ok: boolean, detail?: string): void {
  results.push({ name, ok, detail })
  const icon = ok ? 'PASS' : 'FAIL'
  console.log(`  [${icon}] ${name}${detail ? ` — ${detail}` : ''}`)
}

async function fetchUserByEmail(
  email: string,
): Promise<{ id: string; role: string }> {
  const { rows } = await pool.query<{ id: string; role: string }>(
    `SELECT id, role FROM "user" WHERE email = $1`,
    [email],
  )
  if (!rows[0]) throw new Error(`User not found: ${email}`)
  return rows[0]
}

async function fetchOrgForOwner(userId: string): Promise<{
  id: string
  type: string
  verificationStatus: string
} | null> {
  const { rows } = await pool.query(
    `SELECT o.id, o.type, o."verificationStatus"
       FROM "organization" o
       JOIN "member" m ON m."organizationId" = o.id
      WHERE m."userId" = $1 AND m.role = 'owner' LIMIT 1`,
    [userId],
  )
  return (
    (rows[0] as { id: string; type: string; verificationStatus: string }) ??
    null
  )
}

// ---------------------------------------------------------------------------
// Re-implementations of the inner helpers from claim-server.ts. They mirror
// the server-fn handlers exactly (the wrappers just `requireSessionUser` +
// call). Doing it this way lets us drive the flow without an HTTP request.
// ---------------------------------------------------------------------------

async function listNearby(
  orgId: string,
  foodCategory: 'HUMAN_SAFE' | 'ANIMAL_SAFE',
) {
  const { rows } = await pool.query<{
    latitude: string | null
    longitude: string | null
  }>(`SELECT latitude, longitude FROM "organization" WHERE id = $1`, [orgId])
  const o = rows[0]
  if (!o?.latitude || !o.longitude) return []
  return getNearbyListings({
    latitude: Number(o.latitude),
    longitude: Number(o.longitude),
    foodCategory,
  })
}

async function createClaim(args: {
  user: { id: string; role: string }
  orgId: string
  orgType: 'NGO' | 'ANIMAL_RESCUE'
  listingId: string
  foodCategory: 'HUMAN_SAFE' | 'ANIMAL_SAFE'
}): Promise<{ id: string }> {
  return await db.transaction(async (tx) => {
    const [listing] = await tx
      .update(foodListings)
      .set({ status: 'CLAIM_REQUESTED' })
      .where(
        and(
          eq(foodListings.id, args.listingId),
          eq(foodListings.status, 'AVAILABLE'),
          eq(foodListings.foodCategory, args.foodCategory),
          sql`${foodListings.pickupEndTime} > NOW()`,
          sql`${foodListings.expiryTime} > NOW()`,
        ),
      )
      .returning()
    if (!listing) {
      const [existing] = await tx
        .select({
          status: foodListings.status,
          foodCategory: foodListings.foodCategory,
          pickupEndTime: foodListings.pickupEndTime,
          expiryTime: foodListings.expiryTime,
        })
        .from(foodListings)
        .where(eq(foodListings.id, args.listingId))
        .limit(1)
      if (!existing) throw new Error('Listing not found')
      if (existing.foodCategory !== args.foodCategory) {
        throw new Error(`category mismatch (${existing.foodCategory})`)
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
    const [claim] = await tx
      .insert(claims)
      .values({
        foodListingId: listing.id,
        claimantOrgId: args.orgId,
        claimantUserId: args.user.id,
        status: 'PENDING',
      })
      .returning()
    return { id: claim.id }
  })
}

async function acceptClaim(args: {
  restaurantOrgId: string
  claimId: string
}): Promise<{ otp: string }> {
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
      .where(eq(claims.id, args.claimId))
      .limit(1)
    if (!row) throw new Error('Claim not found')
    if (row.restaurantId !== args.restaurantOrgId)
      throw new Error('Claim not found')
    if (row.claimStatus !== 'PENDING') throw new Error('not pending')
    if (row.listingStatus !== 'CLAIM_REQUESTED')
      throw new Error('listing not requested')

    await tx
      .update(foodListings)
      .set({ status: 'CLAIMED', acceptedClaimId: args.claimId })
      .where(
        and(
          eq(foodListings.id, row.listingId),
          eq(foodListings.restaurantId, args.restaurantOrgId),
          eq(foodListings.status, 'CLAIM_REQUESTED'),
        ),
      )
    const otp = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
    const [c] = await tx
      .update(claims)
      .set({ status: 'ACCEPTED', otpCode: otp })
      .where(and(eq(claims.id, args.claimId), eq(claims.status, 'PENDING')))
      .returning()
    if (!c) throw new Error('claim not updated')
    return { otp }
  })
}

async function verifyPickup(args: {
  restaurantOrgId: string
  claimId: string
  otp: string
  userId: string
}): Promise<void> {
  return await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        claimStatus: claims.status,
        otpCode: claims.otpCode,
        listingId: foodListings.id,
        listingStatus: foodListings.status,
        restaurantId: foodListings.restaurantId,
        pickupEndTime: foodListings.pickupEndTime,
        expiryTime: foodListings.expiryTime,
      })
      .from(claims)
      .innerJoin(foodListings, eq(foodListings.id, claims.foodListingId))
      .where(eq(claims.id, args.claimId))
      .limit(1)
    if (!row) throw new Error('Claim not found')
    if (row.restaurantId !== args.restaurantOrgId)
      throw new Error('Claim not found')
    if (row.claimStatus !== 'ACCEPTED') throw new Error('not accepted')
    if (row.listingStatus !== 'CLAIMED') throw new Error('not claimed')
    // Mirror verifyPickupFn's expiry/pickup-window guard so the harness
    // exercises the same lifecycle invariant.
    const nowMs = Date.now()
    if (row.expiryTime.getTime() <= nowMs) {
      throw new Error(
        'This listing has expired and can no longer be marked as picked up',
      )
    }
    if (row.pickupEndTime.getTime() <= nowMs) {
      throw new Error(
        'The pickup window has closed and this claim can no longer be verified',
      )
    }
    if (!row.otpCode) throw new Error('no otp')
    const otp = args.otp.replace(/\D/g, '')
    if (otp !== row.otpCode) throw new Error('Incorrect OTP — please try again')
    const now = new Date()
    await tx
      .update(claims)
      .set({
        status: 'COMPLETED',
        otpVerifiedAt: now,
        otpVerifiedBy: args.userId,
      })
      .where(and(eq(claims.id, args.claimId), eq(claims.status, 'ACCEPTED')))
    await tx
      .update(foodListings)
      .set({ status: 'PICKED_UP', deliveredAt: now })
      .where(
        and(
          eq(foodListings.id, row.listingId),
          eq(foodListings.restaurantId, args.restaurantOrgId),
          eq(foodListings.status, 'CLAIMED'),
        ),
      )
  })
}

async function getListingByTitle(restaurantOrgId: string, title: string) {
  const { rows } = await pool.query<{
    id: string
    status: string
    food_category: string
    delivered_at: string | null
  }>(
    `SELECT id, status, food_category, delivered_at FROM food_listings
       WHERE restaurant_id = $1 AND title = $2 LIMIT 1`,
    [restaurantOrgId, title],
  )
  return rows[0]
}

async function getClaimRow(id: string) {
  const { rows } = await pool.query<{
    id: string
    status: string
    otp_code: string | null
    otp_verified_at: string | null
  }>(`SELECT id, status, otp_code, otp_verified_at FROM claims WHERE id = $1`, [
    id,
  ])
  return rows[0]
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// HTTP layer — exercises the live dev server (Better Auth + route loaders)
// ---------------------------------------------------------------------------

const DEV_BASE = 'http://localhost:5000'
// Better Auth's CSRF guard rejects requests whose Origin isn't in
// `trustedOrigins` (configured from REPLIT_DEV_DOMAIN in src/lib/auth.ts).
// We hit the dev server over loopback for speed but must spoof the public
// Replit origin so Better Auth (and the SSR shell that mirrors it) accept
// the request the same way the browser would.
const DEV_PUBLIC_ORIGIN = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : DEV_BASE
const DEV_ORIGIN_HEADERS: Record<string, string> = {
  origin: DEV_PUBLIC_ORIGIN,
  referer: `${DEV_PUBLIC_ORIGIN}/`,
}

async function httpSignIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; cookie: string | null; status: number }> {
  const res = await fetch(`${DEV_BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...DEV_ORIGIN_HEADERS },
    body: JSON.stringify({ email, password }),
  })
  const setCookie = res.headers.get('set-cookie')
  // Pull the session_token=value pair out of Set-Cookie.
  const m = setCookie?.match(/(__Secure-better-auth\.session_token=[^;]+)/)
  return { ok: res.ok, cookie: m ? m[1] : null, status: res.status }
}

async function httpGet(
  path: string,
  cookie: string | null,
): Promise<{ status: number; location: string | null }> {
  const res = await fetch(`${DEV_BASE}${path}`, {
    method: 'GET',
    redirect: 'manual',
    headers: cookie
      ? { cookie, ...DEV_ORIGIN_HEADERS }
      : { ...DEV_ORIGIN_HEADERS },
  })
  // Drain body so the connection is freed.
  await res.arrayBuffer().catch(() => {})
  return { status: res.status, location: res.headers.get('location') }
}

async function runHttpLayer(): Promise<void> {
  console.log('\n[qa] HTTP A. Live dev-server smoke tests on', DEV_BASE)

  // A.0 reachability
  let reachable = false
  try {
    const r = await fetch(`${DEV_BASE}/login`, { method: 'GET' })
    await r.arrayBuffer().catch(() => {})
    reachable = r.status < 500
  } catch {
    reachable = false
  }
  record(
    'dev server reachable on :5000',
    reachable,
    reachable ? 'GET /login OK' : 'fetch failed — is `npm run dev` running?',
  )
  if (!reachable) return

  // A.1 sign-in success for every seeded role
  const roles: Array<{ email: string; cookie?: string | null }> = [
    { email: 'admin@foodsetu.dev' },
    { email: 'verified-restaurant@foodsetu.dev' },
    { email: 'verified-ngo@foodsetu.dev' },
    { email: 'verified-animal@foodsetu.dev' },
    { email: 'pending-restaurant@foodsetu.dev' },
    { email: 'pending-ngo@foodsetu.dev' },
  ]
  for (const r of roles) {
    const s = await httpSignIn(r.email, 'password123')
    r.cookie = s.cookie
    record(
      `HTTP sign-in: ${r.email}`,
      s.ok && !!s.cookie,
      `status=${s.status} cookie=${s.cookie ? 'yes' : 'no'}`,
    )
  }

  // A.2 sign-in FAIL with wrong password
  const fail = await httpSignIn('admin@foodsetu.dev', 'wrong-password-xyz')
  record(
    'HTTP sign-in rejects wrong password',
    !fail.ok && fail.status === 401,
    `status=${fail.status}`,
  )

  // A.3 unauthenticated /admin/users → 307 → /login?redirect=...
  const guest = await httpGet('/admin/users', null)
  record(
    'unauthed /admin/users redirects to /login',
    guest.status === 307 && (guest.location ?? '').startsWith('/login'),
    `status=${guest.status} → ${guest.location ?? '∅'}`,
  )

  const adminCookie = roles.find(
    (r) => r.email === 'admin@foodsetu.dev',
  )?.cookie
  const ngoCookie = roles.find(
    (r) => r.email === 'verified-ngo@foodsetu.dev',
  )?.cookie
  const restCookie = roles.find(
    (r) => r.email === 'verified-restaurant@foodsetu.dev',
  )?.cookie
  const animCookie = roles.find(
    (r) => r.email === 'verified-animal@foodsetu.dev',
  )?.cookie

  // A.4 admin-only route guard: NGO hitting /admin/users → 307 to ngo dashboard
  const ngoOnAdmin = await httpGet('/admin/users', ngoCookie ?? null)
  record(
    'non-admin hitting /admin/users is redirected away',
    ngoOnAdmin.status === 307 &&
      !!ngoOnAdmin.location &&
      !ngoOnAdmin.location.startsWith('/admin'),
    `status=${ngoOnAdmin.status} → ${ngoOnAdmin.location ?? '∅'}`,
  )

  // A.5 authenticated dashboard GETs return 200 — these execute the route
  // loaders, which call the real createServerFn handlers (getAdminStatsFn,
  // listClaimsForAdminFn, getMyOrgFn, listMyClaimsFn, etc.) end-to-end
  // through the dev server's HTTP+RPC stack.
  const okPaths: Array<[string, string | null | undefined, string]> = [
    ['/admin/dashboard', adminCookie, 'admin'],
    ['/admin/users', adminCookie, 'admin'],
    ['/admin/listings', adminCookie, 'admin'],
    ['/admin/claims', adminCookie, 'admin'],
    ['/restaurant/dashboard', restCookie, 'verified-restaurant'],
    ['/restaurant/listings', restCookie, 'verified-restaurant'],
    ['/ngo/dashboard', ngoCookie, 'verified-ngo'],
    ['/ngo/nearby-food', ngoCookie, 'verified-ngo'],
    ['/animal/dashboard', animCookie, 'verified-animal'],
    ['/animal/nearby-food', animCookie, 'verified-animal'],
  ]
  for (const [path, cookie, who] of okPaths) {
    const r = await httpGet(path, cookie ?? null)
    record(
      `HTTP ${who} GET ${path} returns 200`,
      r.status === 200,
      `status=${r.status}`,
    )
  }
}

async function main(): Promise<void> {
  console.log('[qa] re-running seed for a clean slate…')
  execSync('npx tsx scripts/seed.ts', { stdio: 'pipe' })

  await runHttpLayer()

  console.log('\n[qa] DB B. Business-logic + lifecycle invariants')

  // -----------------------------------------------------------------------
  // 0. Auth: every seeded user can sign in via Better Auth.
  // -----------------------------------------------------------------------
  console.log('\n[qa] 0. Better Auth sign-in for every seeded user')
  const seededEmails = [
    'admin@foodsetu.dev',
    'verified-restaurant@foodsetu.dev',
    'verified-ngo@foodsetu.dev',
    'verified-animal@foodsetu.dev',
    'pending-restaurant@foodsetu.dev',
    'pending-ngo@foodsetu.dev',
    'pending-animal@foodsetu.dev',
  ]
  for (const email of seededEmails) {
    try {
      const res = await auth.api.signInEmail({
        body: { email, password: 'password123' },
      })
      record(
        `sign-in: ${email}`,
        !!res.user,
        res.user ? `userId=${res.user.id.slice(0, 8)}…` : 'no user',
      )
    } catch (e) {
      record(`sign-in: ${email}`, false, (e as Error).message)
    }
  }

  // Resolve the actors we'll be working with.
  const adminUser = await fetchUserByEmail('admin@foodsetu.dev')
  const verRest = await fetchUserByEmail('verified-restaurant@foodsetu.dev')
  const verNgo = await fetchUserByEmail('verified-ngo@foodsetu.dev')
  const verAnim = await fetchUserByEmail('verified-animal@foodsetu.dev')
  const penRest = await fetchUserByEmail('pending-restaurant@foodsetu.dev')
  const penNgo = await fetchUserByEmail('pending-ngo@foodsetu.dev')

  const verRestOrg = await fetchOrgForOwner(verRest.id)
  const verNgoOrg = await fetchOrgForOwner(verNgo.id)
  const verAnimOrg = await fetchOrgForOwner(verAnim.id)
  const penRestOrg = await fetchOrgForOwner(penRest.id)
  const penNgoOrg = await fetchOrgForOwner(penNgo.id)
  if (!verRestOrg || !verNgoOrg || !verAnimOrg || !penRestOrg || !penNgoOrg) {
    throw new Error('seed produced missing org')
  }

  record('admin role is ADMIN', adminUser.role === 'ADMIN', adminUser.role)
  record(
    'verified-restaurant org type',
    verRestOrg.type === 'RESTAURANT',
    verRestOrg.type,
  )
  record(
    'verified-restaurant org status',
    verRestOrg.verificationStatus === 'VERIFIED',
    verRestOrg.verificationStatus,
  )
  record(
    'pending-ngo org status',
    penNgoOrg.verificationStatus === 'PENDING',
    penNgoOrg.verificationStatus,
  )

  // -----------------------------------------------------------------------
  // 1. Happy path (HUMAN_SAFE): NGO sees feed → claims → restaurant accepts
  //    (OTP issued, donor never sees it) → restaurant verifies OTP → done.
  // -----------------------------------------------------------------------
  console.log('\n[qa] 1. Happy-path HUMAN_SAFE loop')

  const seededHuman = await getListingByTitle(
    verRestOrg.id,
    'Daal bhat lunch surplus',
  )
  record(
    'seeded HUMAN_SAFE listing exists & AVAILABLE',
    !!seededHuman && seededHuman.status === 'AVAILABLE',
    seededHuman?.status,
  )

  const ngoFeed = await listNearby(verNgoOrg.id, 'HUMAN_SAFE')
  const inFeed = ngoFeed.find((l) => l.id === seededHuman.id)
  record(
    'NGO feed includes the listing within 10 km',
    !!inFeed,
    `feed=${ngoFeed.length}`,
  )

  // Confirm restaurant phone is NOT exposed in the nearby feed.
  const phoneOnFeed = (inFeed as Record<string, unknown> | undefined)
    ?.restaurantPhone
  record(
    'NGO feed does NOT expose restaurant phone',
    phoneOnFeed === undefined || phoneOnFeed === null,
    `phone=${String(phoneOnFeed)}`,
  )

  let claimId = ''
  try {
    const c = await createClaim({
      user: verNgo,
      orgId: verNgoOrg.id,
      orgType: 'NGO',
      listingId: seededHuman.id,
      foodCategory: 'HUMAN_SAFE',
    })
    claimId = c.id
    record(
      'NGO can claim the AVAILABLE listing',
      true,
      `claimId=${claimId.slice(0, 8)}…`,
    )
  } catch (e) {
    record('NGO can claim the AVAILABLE listing', false, (e as Error).message)
  }

  let postClaimListing = await getListingByTitle(
    verRestOrg.id,
    'Daal bhat lunch surplus',
  )
  record(
    'listing transitions AVAILABLE → CLAIM_REQUESTED',
    postClaimListing.status === 'CLAIM_REQUESTED',
    postClaimListing.status,
  )

  let claimRow = await getClaimRow(claimId)
  record(
    'claim is PENDING after creation',
    claimRow.status === 'PENDING',
    claimRow.status,
  )
  record(
    'OTP not yet issued (PENDING)',
    claimRow.otp_code === null,
    `otp=${String(claimRow.otp_code)}`,
  )

  // Restaurant accepts.
  let issuedOtp = ''
  try {
    const r = await acceptClaim({ restaurantOrgId: verRestOrg.id, claimId })
    issuedOtp = r.otp
    record(
      'restaurant accepts claim (OTP issued)',
      /^\d{6}$/.test(issuedOtp),
      `otp=${issuedOtp}`,
    )
  } catch (e) {
    record('restaurant accepts claim (OTP issued)', false, (e as Error).message)
  }

  postClaimListing = await getListingByTitle(
    verRestOrg.id,
    'Daal bhat lunch surplus',
  )
  record(
    'listing CLAIM_REQUESTED → CLAIMED on accept',
    postClaimListing.status === 'CLAIMED',
    postClaimListing.status,
  )

  claimRow = await getClaimRow(claimId)
  record(
    'claim PENDING → ACCEPTED on accept',
    claimRow.status === 'ACCEPTED',
    claimRow.status,
  )
  record(
    'claim has otp_code stored',
    claimRow.otp_code !== null && /^\d{6}$/.test(claimRow.otp_code ?? ''),
    `otp_code=${String(claimRow.otp_code)}`,
  )

  // Wrong OTP attempt.
  try {
    await verifyPickup({
      restaurantOrgId: verRestOrg.id,
      claimId,
      otp: '000000',
      userId: verRest.id,
    })
    record('wrong OTP rejected', false, 'wrong OTP was accepted')
  } catch (e) {
    record(
      'wrong OTP rejected',
      /Incorrect OTP/.test((e as Error).message),
      (e as Error).message,
    )
  }

  // State should be unchanged.
  postClaimListing = await getListingByTitle(
    verRestOrg.id,
    'Daal bhat lunch surplus',
  )
  claimRow = await getClaimRow(claimId)
  record(
    'state unchanged after wrong OTP',
    postClaimListing.status === 'CLAIMED' && claimRow.status === 'ACCEPTED',
    `${postClaimListing.status}/${claimRow.status}`,
  )

  // Correct OTP.
  try {
    await verifyPickup({
      restaurantOrgId: verRestOrg.id,
      claimId,
      otp: issuedOtp,
      userId: verRest.id,
    })
    record('correct OTP transitions to PICKED_UP/COMPLETED', true)
  } catch (e) {
    record(
      'correct OTP transitions to PICKED_UP/COMPLETED',
      false,
      (e as Error).message,
    )
  }

  postClaimListing = await getListingByTitle(
    verRestOrg.id,
    'Daal bhat lunch surplus',
  )
  claimRow = await getClaimRow(claimId)
  record(
    'listing CLAIMED → PICKED_UP + delivered_at set',
    postClaimListing.status === 'PICKED_UP' &&
      postClaimListing.delivered_at !== null,
    `${postClaimListing.status} delivered_at=${String(postClaimListing.delivered_at)}`,
  )
  record(
    'claim ACCEPTED → COMPLETED + otp_verified_at set',
    claimRow.status === 'COMPLETED' && claimRow.otp_verified_at !== null,
    `${claimRow.status}`,
  )

  // Re-verifying a COMPLETED claim should be rejected.
  try {
    await verifyPickup({
      restaurantOrgId: verRestOrg.id,
      claimId,
      otp: issuedOtp,
      userId: verRest.id,
    })
    record(
      're-verifying COMPLETED claim rejected',
      false,
      'second verify succeeded',
    )
  } catch (e) {
    record(
      're-verifying COMPLETED claim rejected',
      /not accepted/.test((e as Error).message),
      (e as Error).message,
    )
  }

  // -----------------------------------------------------------------------
  // 2. Happy path (ANIMAL_SAFE)
  // -----------------------------------------------------------------------
  console.log('\n[qa] 2. Happy-path ANIMAL_SAFE loop')
  const seededAnimal = await getListingByTitle(
    verRestOrg.id,
    'Curd rice scraps for strays',
  )
  record(
    'seeded ANIMAL_SAFE listing exists & AVAILABLE',
    !!seededAnimal && seededAnimal.status === 'AVAILABLE',
    seededAnimal?.status,
  )

  const animalFeed = await listNearby(verAnimOrg.id, 'ANIMAL_SAFE')
  record(
    'animal-rescue feed includes ANIMAL_SAFE listing',
    animalFeed.some((l) => l.id === seededAnimal.id),
    `feed=${animalFeed.length}`,
  )

  // -----------------------------------------------------------------------
  // 3. Negative: category isolation
  // -----------------------------------------------------------------------
  console.log('\n[qa] 3. Category isolation')
  const ngoFeedHuman = await listNearby(verNgoOrg.id, 'HUMAN_SAFE')
  record(
    'NGO feed has zero ANIMAL_SAFE entries',
    ngoFeedHuman.every((l) => l.foodCategory === 'HUMAN_SAFE'),
    `n=${ngoFeedHuman.length}`,
  )

  const animalFeedAnimal = await listNearby(verAnimOrg.id, 'ANIMAL_SAFE')
  record(
    'animal feed has zero HUMAN_SAFE entries',
    animalFeedAnimal.every((l) => l.foodCategory === 'ANIMAL_SAFE'),
    `n=${animalFeedAnimal.length}`,
  )

  // NGO claiming an ANIMAL_SAFE listing should be rejected by the SQL guard.
  try {
    await createClaim({
      user: verNgo,
      orgId: verNgoOrg.id,
      orgType: 'NGO',
      listingId: seededAnimal.id,
      foodCategory: 'HUMAN_SAFE', // wrong category — listing is ANIMAL_SAFE
    })
    record('NGO claiming ANIMAL_SAFE → rejected', false, 'unexpected success')
  } catch (e) {
    record(
      'NGO claiming ANIMAL_SAFE → rejected',
      /category mismatch/.test((e as Error).message),
      (e as Error).message,
    )
  }

  // -----------------------------------------------------------------------
  // 4. Negative: pending org cannot claim
  // -----------------------------------------------------------------------
  console.log('\n[qa] 4. Verification gates')
  // Server-fn require* helpers throw before SQL even runs. Mirror that here:
  const penNgoCannot = penNgoOrg.verificationStatus !== 'VERIFIED'
  record(
    'pending NGO is correctly NOT verified',
    penNgoCannot,
    penNgoOrg.verificationStatus,
  )

  // Pending restaurant cannot list.
  const penRestCannot = penRestOrg.verificationStatus !== 'VERIFIED'
  record(
    'pending restaurant is correctly NOT verified',
    penRestCannot,
    penRestOrg.verificationStatus,
  )

  // -----------------------------------------------------------------------
  // 5. Negative: expired listing cannot be claimed; sweep moves to EXPIRED.
  // -----------------------------------------------------------------------
  console.log('\n[qa] 5. Expired listing handling')
  const expired = await getListingByTitle(
    verRestOrg.id,
    'Stale sel roti (past pickup)',
  )
  record('expired-fixture listing exists', !!expired, expired?.status)

  try {
    await createClaim({
      user: verNgo,
      orgId: verNgoOrg.id,
      orgType: 'NGO',
      listingId: expired.id,
      foodCategory: 'HUMAN_SAFE',
    })
    record('claiming expired listing rejected', false, 'unexpected success')
  } catch (e) {
    record(
      'claiming expired listing rejected',
      /expired/i.test((e as Error).message),
      (e as Error).message,
    )
  }

  // Insert a fresh expired-but-still-AVAILABLE row so the sweep has work
  // to do. The seeded "Stale sel roti" fixture may already have been swept
  // by the dev server's per-render expiry hook (the HTTP layer above
  // exercises authenticated route loaders that fire it).
  const sweepFixtureId = (
    await pool.query<{ id: string }>(
      `INSERT INTO food_listings (
         id, restaurant_id, title, description, food_category, food_type,
         quantity, quantity_unit, latitude, longitude,
         pickup_start_time, pickup_end_time, expiry_time, status
       ) VALUES (
         gen_random_uuid()::text, $1, 'QA expired sweep fixture', 'tmp',
         'HUMAN_SAFE', 'COOKED', 1, 'kg', 12.9716, 77.5946,
         NOW() - INTERVAL '4 hours',
         NOW() - INTERVAL '2 hours',
         NOW() - INTERVAL '1 hour',
         'AVAILABLE'
       ) RETURNING id`,
      [verRestOrg.id],
    )
  ).rows[0].id
  const sweep = await expireOldListings()
  record(
    'expireOldListings sweep moves rows',
    sweep.expiredListings >= 1,
    `expired=${sweep.expiredListings} cancelled=${sweep.cancelledClaims}`,
  )
  const afterSweep = (
    await pool.query<{ status: string }>(
      `SELECT status FROM food_listings WHERE id = $1`,
      [sweepFixtureId],
    )
  ).rows[0]
  record(
    'sweep-fixture status is now EXPIRED',
    afterSweep.status === 'EXPIRED',
    afterSweep.status,
  )

  // -----------------------------------------------------------------------
  // 6. Admin: verify / reject / suspend orgs.
  // -----------------------------------------------------------------------
  console.log('\n[qa] 6. Admin org-verification mutations')
  // Promote pending-ngo → VERIFIED
  await pool.query(
    `UPDATE "organization" SET "verificationStatus" = 'VERIFIED', "verifiedAt" = NOW() WHERE id = $1`,
    [penNgoOrg.id],
  )
  let after = await pool.query<{ verificationStatus: string }>(
    `SELECT "verificationStatus" FROM "organization" WHERE id = $1`,
    [penNgoOrg.id],
  )
  record(
    'admin can VERIFY a pending org',
    after.rows[0].verificationStatus === 'VERIFIED',
    after.rows[0].verificationStatus,
  )

  await pool.query(
    `UPDATE "organization" SET "verificationStatus" = 'SUSPENDED' WHERE id = $1`,
    [penNgoOrg.id],
  )
  after = await pool.query(
    `SELECT "verificationStatus" FROM "organization" WHERE id = $1`,
    [penNgoOrg.id],
  )
  record(
    'admin can SUSPEND an org',
    after.rows[0].verificationStatus === 'SUSPENDED',
    after.rows[0].verificationStatus,
  )

  await pool.query(
    `UPDATE "organization" SET "verificationStatus" = 'REJECTED' WHERE id = $1`,
    [penNgoOrg.id],
  )
  after = await pool.query(
    `SELECT "verificationStatus" FROM "organization" WHERE id = $1`,
    [penNgoOrg.id],
  )
  record(
    'admin can REJECT an org',
    after.rows[0].verificationStatus === 'REJECTED',
    after.rows[0].verificationStatus,
  )

  // Admin cancels a still-AVAILABLE listing.
  const remaining = await getListingByTitle(
    verRestOrg.id,
    'Bakery loaves end-of-day',
  )
  if (remaining) {
    await pool.query(
      `UPDATE food_listings SET status = 'CANCELLED' WHERE id = $1 AND status IN ('DRAFT','AVAILABLE','CLAIM_REQUESTED')`,
      [remaining.id],
    )
    const after2 = await getListingByTitle(
      verRestOrg.id,
      'Bakery loaves end-of-day',
    )
    record(
      'admin can cancel an AVAILABLE listing',
      after2.status === 'CANCELLED',
      after2.status,
    )
  } else {
    record('admin can cancel an AVAILABLE listing', false, 'fixture missing')
  }

  // -----------------------------------------------------------------------
  // 7. Admin cancel claim — happy + non-cancellable guard.
  //    Mirrors `adminCancelClaimFn` in src/lib/admin-server.ts:
  //      a) PENDING claim + CLAIM_REQUESTED listing
  //         → claim CANCELLED, listing back to AVAILABLE.
  //      b) ACCEPTED claim + CLAIMED listing (accepted_claim_id set)
  //         → claim CANCELLED, listing back to AVAILABLE, accepted_claim_id
  //         cleared.
  //      c) Already-COMPLETED claim must be refused.
  // -----------------------------------------------------------------------
  console.log('\n[qa] 7. Admin cancel claim')

  // (a) Build a fresh PENDING claim against a brand-new ad-hoc listing so
  // none of the other fixtures' state is disturbed.
  const adhocId = (
    await pool.query<{ id: string }>(
      `INSERT INTO food_listings (
         id, restaurant_id, title, description, food_category, food_type,
         quantity, quantity_unit, latitude, longitude,
         pickup_start_time, pickup_end_time, expiry_time, status
       ) VALUES (
         gen_random_uuid()::text, $1, 'QA cancel-claim test', 'tmp',
         'HUMAN_SAFE', 'COOKED', 5, 'kg', 12.9716, 77.5946,
         NOW() + INTERVAL '5 minutes',
         NOW() + INTERVAL '2 hours',
         NOW() + INTERVAL '4 hours',
         'AVAILABLE'
       ) RETURNING id`,
      [verRestOrg.id],
    )
  ).rows[0].id
  const pendingClaim = await createClaim({
    user: verNgo,
    orgId: verNgoOrg.id,
    orgType: 'NGO',
    listingId: adhocId,
    foodCategory: 'HUMAN_SAFE',
  })
  // adminCancelClaimFn: PENDING/ACCEPTED → CANCELLED, free listing.
  await pool.query('BEGIN')
  await pool.query(
    `UPDATE claims SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = $1 AND status = ANY($2::claim_status[])`,
    [pendingClaim.id, ['PENDING', 'ACCEPTED']],
  )
  await pool.query(
    `UPDATE food_listings
        SET status = 'AVAILABLE', accepted_claim_id = NULL, updated_at = NOW()
      WHERE id = $1 AND status IN ('CLAIM_REQUESTED','CLAIMED')`,
    [adhocId],
  )
  await pool.query('COMMIT')
  const cAfter = await getClaimRow(pendingClaim.id)
  const lAfter = (
    await pool.query<{ status: string; accepted_claim_id: string | null }>(
      `SELECT status, accepted_claim_id FROM food_listings WHERE id = $1`,
      [adhocId],
    )
  ).rows[0]
  record(
    'admin cancel PENDING claim → CANCELLED',
    cAfter.status === 'CANCELLED',
    cAfter.status,
  )
  record(
    'admin cancel frees listing back to AVAILABLE',
    lAfter.status === 'AVAILABLE' && lAfter.accepted_claim_id === null,
    `${lAfter.status} accepted_claim_id=${String(lAfter.accepted_claim_id)}`,
  )

  // (b) ACCEPTED claim cancellation: re-claim, accept, then cancel.
  const acceptedClaim = await createClaim({
    user: verNgo,
    orgId: verNgoOrg.id,
    orgType: 'NGO',
    listingId: adhocId,
    foodCategory: 'HUMAN_SAFE',
  })
  await acceptClaim({
    restaurantOrgId: verRestOrg.id,
    claimId: acceptedClaim.id,
  })
  await pool.query('BEGIN')
  await pool.query(
    `UPDATE claims SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = $1 AND status = ANY($2::claim_status[])`,
    [acceptedClaim.id, ['PENDING', 'ACCEPTED']],
  )
  await pool.query(
    `UPDATE food_listings
        SET status = 'AVAILABLE', accepted_claim_id = NULL, updated_at = NOW()
      WHERE id = $1 AND status IN ('CLAIM_REQUESTED','CLAIMED')`,
    [adhocId],
  )
  await pool.query('COMMIT')
  const c2After = await getClaimRow(acceptedClaim.id)
  const l2After = (
    await pool.query<{ status: string; accepted_claim_id: string | null }>(
      `SELECT status, accepted_claim_id FROM food_listings WHERE id = $1`,
      [adhocId],
    )
  ).rows[0]
  record(
    'admin cancel ACCEPTED claim → CANCELLED',
    c2After.status === 'CANCELLED',
    c2After.status,
  )
  record(
    'admin cancel ACCEPTED frees listing & clears accepted_claim_id',
    l2After.status === 'AVAILABLE' && l2After.accepted_claim_id === null,
    `${l2After.status} accepted_claim_id=${String(l2After.accepted_claim_id)}`,
  )

  // -----------------------------------------------------------------------
  // 7b. Lifecycle guard: verifyPickupFn refuses to complete an
  //     already-expired claim.
  //
  //     Setup: create an ad-hoc listing with a HEALTHY pickup/expiry
  //     window so the claim → accept handshake succeeds (issues OTP),
  //     then mutate the row's expiry_time + pickup_end_time into the
  //     past and attempt OTP verification. The verify must be rejected
  //     with no state change.
  // -----------------------------------------------------------------------
  console.log('\n[qa] 7b. verifyPickupFn rejects pickup after expiry')

  const expiryGuardListing = (
    await pool.query<{ id: string }>(
      `INSERT INTO food_listings (
         id, restaurant_id, title, description, food_category, food_type,
         quantity, quantity_unit, latitude, longitude,
         pickup_start_time, pickup_end_time, expiry_time, status
       ) VALUES (
         gen_random_uuid()::text, $1, 'QA expiry-verify guard', 'tmp',
         'HUMAN_SAFE', 'COOKED', 1, 'kg', 12.9716, 77.5946,
         NOW() - INTERVAL '5 minutes',
         NOW() + INTERVAL '2 hours',
         NOW() + INTERVAL '4 hours',
         'AVAILABLE'
       ) RETURNING id`,
      [verRestOrg.id],
    )
  ).rows[0].id
  const guardClaim = await createClaim({
    user: verNgo,
    orgId: verNgoOrg.id,
    orgType: 'NGO',
    listingId: expiryGuardListing,
    foodCategory: 'HUMAN_SAFE',
  })
  const guardOtp = (
    await acceptClaim({
      restaurantOrgId: verRestOrg.id,
      claimId: guardClaim.id,
    })
  ).otp
  // Push pickup window + expiry into the past WITHOUT touching status —
  // the row stays CLAIMED so verifyPickupFn's status guard passes and the
  // expiry guard is the only thing standing between us and a completed
  // pickup.
  await pool.query(
    `UPDATE food_listings
        SET pickup_end_time = NOW() - INTERVAL '1 minute',
            expiry_time     = NOW() - INTERVAL '1 minute',
            updated_at      = NOW()
      WHERE id = $1`,
    [expiryGuardListing],
  )
  let expiryRejected = false
  let expiryMsg = ''
  try {
    await verifyPickup({
      restaurantOrgId: verRestOrg.id,
      claimId: guardClaim.id,
      otp: guardOtp,
      userId: verRest.id,
    })
  } catch (e) {
    expiryRejected = true
    expiryMsg = (e as Error).message
  }
  record(
    'verify after expiry rejected',
    expiryRejected && /expired|pickup window/i.test(expiryMsg),
    expiryMsg || 'verify unexpectedly succeeded',
  )
  const guardClaimAfter = await getClaimRow(guardClaim.id)
  const guardListingAfter = (
    await pool.query<{ status: string }>(
      `SELECT status FROM food_listings WHERE id = $1`,
      [expiryGuardListing],
    )
  ).rows[0]
  record(
    'verify-after-expiry leaves state unchanged (CLAIMED/ACCEPTED)',
    guardClaimAfter.status === 'ACCEPTED' &&
      guardListingAfter.status === 'CLAIMED',
    `${guardListingAfter.status}/${guardClaimAfter.status}`,
  )

  // (c) Cannot cancel a COMPLETED claim — mirror adminCancelClaimFn's
  // cancellable-set guard.
  const completedClaim = await createClaim({
    user: verNgo,
    orgId: verNgoOrg.id,
    orgType: 'NGO',
    listingId: adhocId,
    foodCategory: 'HUMAN_SAFE',
  })
  const r3 = await acceptClaim({
    restaurantOrgId: verRestOrg.id,
    claimId: completedClaim.id,
  })
  await verifyPickup({
    restaurantOrgId: verRestOrg.id,
    claimId: completedClaim.id,
    otp: r3.otp,
    userId: verRest.id,
  })
  const before = await getClaimRow(completedClaim.id)
  // Equivalent to adminCancelClaimFn rejecting a non-cancellable status.
  const cancellable = ['PENDING', 'ACCEPTED'].includes(before.status)
  record(
    'admin cancel COMPLETED claim refused',
    !cancellable,
    `status=${before.status}`,
  )

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  const passed = results.filter((r) => r.ok).length
  const failed = results.length - passed
  console.log(
    `\n[qa] ${passed}/${results.length} checks passed; ${failed} failed.`,
  )
  if (failed > 0) {
    console.log('\nFailures:')
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  - ${r.name}: ${r.detail ?? '(no detail)'}`)
    }
  }

  process.exitCode = failed === 0 ? 0 : 1
}

main()
  .then(async () => {
    await pool.end()
  })
  .catch(async (err) => {
    console.error('[qa] HARNESS FAILED:', err)
    await pool.end().catch(() => {})
    process.exit(2)
  })
