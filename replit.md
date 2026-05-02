# FoodSetu - TanStack Start App

## Overview

A TanStack Start (React + Vite + Nitro SSR) web application with file-based routing, Tailwind CSS v4, and TypeScript.

FoodSetu connects restaurants/hotels/bakeries that have surplus food with verified NGOs, shelters, and animal rescue groups. See **[WORKFLOW.md](./WORKFLOW.md)** for the full end-to-end product flow.

## Architecture

- **Framework**: TanStack Start (SSR React framework built on Vite + Nitro)
- **Router**: TanStack Router (file-based routing in `src/routes/`)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` (CSS-first config in `src/styles.css`)
- **Icons**: `lucide-react` (e.g. `import { Heart } from 'lucide-react'`)
- **Font**: Poppins (loaded from Google Fonts, set as default `font-sans` via Tailwind v4 `@theme`)
- **Database**: Replit-managed PostgreSQL (connection via `DATABASE_URL` + `PG*` env vars)
- **Auth**: Better Auth with email/password + organization plugin (`pg.Pool` adapter)
- **Language**: TypeScript
- **Package Manager**: npm

## Project Structure

```
src/
  lib/
    auth.ts          - Better Auth server config (pg.Pool, plugins, custom fields)
    auth-client.ts   - Better Auth React client
  db/
    index.ts         - Drizzle client (shares pg.Pool with auth)
    schema.ts        - Drizzle schema for domain tables + enums + relations
  routes/
    __root.tsx       - Root layout with head/shell
    index.tsx        - Home page route
    api/
      auth/
        $.ts         - Catch-all Better Auth handler (/api/auth/*)
  router.tsx         - Router configuration
  styles.css         - Global styles (Tailwind import)
drizzle/             - drizzle-kit generated SQL migrations
drizzle.config.ts    - drizzle-kit config
public/              - Static assets
```

## Database & Auth

Two migration systems live side-by-side:

- **Better Auth** owns: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation` (managed by `@better-auth/cli`).
- **Drizzle** owns: `cities`, `food_listings`, `claims`, `reports`, `sms_logs` (managed by `drizzle-kit`).

Domain tables reference `user.id` / `organization.id` as **soft text references** (no FK constraint) so the two systems don't conflict. Application code enforces integrity.

### Enums (Postgres types)

| Enum | Values |
|------|--------|
| `user_role` | ADMIN, RESTAURANT, NGO, ANIMAL_RESCUE |
| `org_type` | RESTAURANT, NGO, ANIMAL_RESCUE |
| `food_category` | HUMAN_SAFE, ANIMAL_SAFE, COMPOST_ONLY |
| `food_listing_status` | DRAFT, AVAILABLE, CLAIM_REQUESTED, CLAIMED, PICKED_UP, EXPIRED, CANCELLED, REPORTED |
| `claim_status` | PENDING, ACCEPTED, REJECTED, CANCELLED, PICKED_UP, COMPLETED |
| `verification_status` | PENDING, VERIFIED, REJECTED, SUSPENDED |
| `report_reason` | SPOILED, MISLABELED, NO_SHOW, INAPPROPRIATE, OTHER |
| `report_status` | OPEN, REVIEWING, RESOLVED, DISMISSED |
| `sms_purpose` | OTP, NEW_LISTING_ALERT, CLAIM_ACCEPTED, PICKUP_REMINDER, GENERIC |
| `sms_status` | QUEUED, SENT, DELIVERED, FAILED |

### Custom auth fields (managed by Better Auth)

- **`user.role`** (text, default `RESTAURANT`, `input: false` so clients can't self-elevate). Allowed values mirror `user_role` enum.
- **`organization`** extended fields: `type` (default `RESTAURANT`), `cityId`, `phone`, `address`, `description`, `latitude`, `longitude`, `verificationStatus` (default `PENDING`, one of `PENDING|VERIFIED|REJECTED|SUSPENDED`), `verifiedAt`.

### Running migrations

After editing `src/lib/auth.ts` (auth tables / plugins / additional fields):

```bash
npx @better-auth/cli@latest migrate -y
```

After editing `src/db/schema.ts` (domain tables):

```bash
# 1. Generate SQL migration file in drizzle/
npx drizzle-kit generate --name <change_description>

# 2. Apply it (in this Replit, run via the SQL tool — drizzle-kit push needs a TTY)
#    The generated file lives at drizzle/<NNNN>_<name>.sql
```

For local apply without the SQL tool:
```bash
psql "$DATABASE_URL" -f drizzle/<NNNN>_<name>.sql
```

### Health check

`GET /api/auth/ok` → `{"ok":true}`.

## Routes & role-based access

Public routes (under `src/routes/`):
- `/` — landing page (shows different nav based on `useSession()`)
- `/login`, `/register` — auth pages; if already signed in, redirect to the user's dashboard
- `/api/auth/$` — Better Auth handler (catch-all)

Protected routes live under the pathless layout `src/routes/_authed.tsx`. Its `beforeLoad` calls a server function (`getServerSession` in `src/lib/auth-server.ts`) which reads the cookie via `auth.api.getSession({ headers })`. If no session, it redirects to `/login?redirect=<original-href>` and the login page honors that on success. On success it returns `{ user, sessionId }` into route context.

Each dashboard route adds its own `beforeLoad` doing a plain role check (NOT the verification-aware `canX` helpers, which gate _actions_ not _navigation_) and redirecting to `roleToDashboard(user.role)` on mismatch:

| Route | Allowed roles | Notes |
|-------|---------------|-------|
| `/admin/dashboard` | ADMIN | links to `/admin/organizations` |
| `/admin/organizations` | ADMIN | review table; verify / reject / suspend / reset |
| `/restaurant/dashboard` | RESTAURANT, ADMIN | gated by org verification for actions |
| `/ngo/dashboard` | NGO, ADMIN | gated by org verification for actions |
| `/animal/dashboard` | ANIMAL_RESCUE, ADMIN | gated by org verification for actions |
| `/onboarding/organization` | non-ADMIN without an org | one-time profile setup |

After `signIn.email`, the login page navigates to `roleToDashboard(user.role)`. Same after `signUp.email` (auto-sign-in is enabled).

### Organization onboarding & verification

Non-admin users (RESTAURANT, NGO, ANIMAL_RESCUE) **must** create an organization profile before they can act. Flow lives in `src/routes/_authed.tsx` → it fetches the user's org via `getMyOrganizationFn` (`src/lib/org-server.ts`) and:

- if no org and not on `/onboarding/organization` → 307 to `/onboarding/organization`
- if has org and on `/onboarding/organization` → 307 to their dashboard
- if ADMIN and on `/onboarding/organization` → 307 to `/admin/dashboard`

The org `type` is auto-derived from the user's role and shown read-only on the form (so RESTAURANT users can only ever create RESTAURANT orgs, etc.). Cities are fetched from the `cities` table (5 are seeded: Bengaluru, Mumbai, Delhi, Chennai, Hyderabad).

Verification has four states (`VERIFICATION_STATUSES`):

| Status | Banner shown to user | Actions allowed |
|--------|---------------------|-----------------|
| `PENDING` | "Awaiting verification" (amber) | none |
| `VERIFIED` | none (green badge in header) | role's full action set |
| `REJECTED` | "Verification rejected" (red) | none |
| `SUSPENDED` | "Account suspended" (gray) | none |

`canCreateFoodListing(user, org)`, `canClaimHumanFood(user, org)`, `canClaimAnimalFood(user, org)` all require `org.verificationStatus === 'VERIFIED'` for non-admins. `ADMIN` bypasses the org+verification requirement entirely (and never goes through onboarding).

### Restaurant food listings

Routes (under `src/routes/_authed/restaurant/`):

| Route | Purpose |
|-------|---------|
| `/restaurant/dashboard` | Stats cards (active/history listings, pending claims) + quick actions + recent active listings |
| `/restaurant/listings` | Active/history tabbed table |
| `/restaurant/listings/new` | Create form (verification gate inside page) |
| `/restaurant/listings/$id` | Detail view + Cancel button + Edit link |
| `/restaurant/listings/$id/edit` | Edit form (locked when status not editable) |
| `/restaurant/claims` | Active/history tabbed list of incoming claim requests with inline Accept/Reject |
| `/restaurant/claims/$id` | Claim detail view (claimant org + listing) with Accept/Reject decision panel |

All routes use a plain role check (`RESTAURANT|ADMIN`) in `beforeLoad`. The verification gate is checked inside the page render (via `canCreateFoodListing`) — same pattern as the dashboard, to avoid redirect loops.

Server fns live in `src/lib/listing-server.ts`:

| Function | Auth | Purpose |
|----------|------|---------|
| `listMyListingsFn({scope})` | session | `scope` = `active`/`history`/`all`; returns `[]` for non-restaurant or no-org users |
| `getMyListingFn({id})` | session, must own | throws `NOT_FOUND` if not owned (route catches and shows 404) |
| `createListingFn(data)` | verified RESTAURANT | sets `status=AVAILABLE`, inherits `cityId` from org, `restaurantId=org.id` |
| `updateListingFn({id, data})` | verified RESTAURANT, must own | atomic UPDATE WHERE `status IN (DRAFT, AVAILABLE)` AND ownership; disambiguates "not found" vs "wrong status" on no-row |
| `cancelListingFn({id})` | verified RESTAURANT, must own | atomic UPDATE → `CANCELLED` WHERE `status IN (DRAFT, AVAILABLE)` AND ownership |

Validation lives in the same file:
- `pickupEndTime > pickupStartTime` and `expiryTime > pickupStartTime` (mirrored client-side in `ListingForm` for fast feedback; server is the source of truth)
- `quantity > 0`, lat/lng range checks, optional `imageUrl` accepts only `http(s)`
- enum coercion against `FOOD_CATEGORIES`, `FOOD_TYPES`, `QUANTITY_UNITS` (defined in `src/lib/permissions.ts`)

`requireVerifiedRestaurantOrg`: ADMIN bypasses the verification check but still needs to own a RESTAURANT org (no magic restaurantId for admins).

The shared form component is `src/components/ListingForm.tsx`. It bridges the browser's zoneless `datetime-local` value to ISO via `localInputToIso` / `isoToLocalInput` helpers.

Editable / cancelable status sets live in `src/lib/permissions.ts`:
- `EDITABLE_LISTING_STATUSES = ['DRAFT', 'AVAILABLE']`
- `CANCELABLE_LISTING_STATUSES = ['DRAFT', 'AVAILABLE']`
- `ACTIVE_LISTING_STATUSES = ['DRAFT', 'AVAILABLE', 'CLAIM_REQUESTED', 'CLAIMED']`
- `HISTORY_LISTING_STATUSES = ['PICKED_UP', 'EXPIRED', 'CANCELLED', 'REPORTED']`

### Claimant flows (NGO + Animal Rescue)

The NGO and Animal Rescue claim flows are structurally identical — same UI,
same atomic-transaction logic, same race guards. Only the org type and food
category differ. They are encoded as a `ClaimantKind` inside
`src/lib/claim-server.ts`:

| Kind | Org type | Food category | Routes |
|------|----------|---------------|--------|
| `NGO_KIND` | `NGO` | `HUMAN_SAFE` | `/ngo/dashboard`, `/ngo/nearby-food`, `/ngo/my-claims` |
| `ANIMAL_KIND` | `ANIMAL_RESCUE` | `ANIMAL_SAFE` | `/animal/dashboard`, `/animal/nearby-food`, `/animal/my-claims` |

Routes (under `src/routes/_authed/{ngo,animal}/`):

| Route | Purpose |
|-------|---------|
| `…/dashboard` | Stat cards (nearby/active/total claims) + quick actions + previews of nearby food and active claims |
| `…/nearby-food` | Card grid of category-matched + AVAILABLE listings with distance/pickup/expiry; Claim button per card |
| `…/my-claims` | Active/history tabbed cards; restaurant phone revealed only after claim is `ACCEPTED` or `PICKED_UP` |

All claim routes use a plain role check (`NGO|ADMIN` or `ANIMAL_RESCUE|ADMIN`) in `beforeLoad`. The verification gate is checked inside the page render (via `canManageNgoClaims` / `canManageAnimalClaims`) — same pattern as restaurant routes, to avoid redirect loops.

**Shared UI components** (`src/components/food/`):

| Component | Used by | Purpose |
|-----------|---------|---------|
| `NearbyFoodCard` | `…/nearby-food` (both flows) | Renders one listing card with title/quantity/type/pickup/expires/distance/area + Claim button. Exports `formatTime`, `formatDistance`, `formatDistanceLong` helpers. |
| `MyClaimCard` | `…/my-claims` (both flows) | Renders one claim card with status badge, listing details, and a `tel:` link when `restaurantPhone` is non-null (i.e. server says claim is ACCEPTED/PICKED_UP). |
| `StatCard`, `TabBtn` | `…/dashboard`, `…/my-claims` (both flows) | Reusable stat card and active/history tab pill. |

Server fns live in `src/lib/claim-server.ts`. Internal helpers
(`listNearbyFoodForKind`, `listMyClaimsForKind`, `createClaimForKind`) take a
`ClaimantKind` so logic is written once. Six exported server fns wrap them:

| Function | Auth | Purpose |
|----------|------|---------|
| `listNearbyHumanFoodFn()` / `listNearbyAnimalFoodFn()` | session | Returns `[]` for callers without a verified org of the matching type. SQL filters `food_category=$1 AND status='AVAILABLE' AND expiry_time > NOW() AND pickup_end_time > NOW()` (LIMIT 200). **Restaurant phone is intentionally NOT selected — contact info is gated behind an accepted claim.** Distance is computed in TS via `haversineKm`. Sorted by distance asc (nulls last) then `expiryTime` asc; returns top 100. |
| `listMyClaimsFn()` / `listMyAnimalClaimsFn()` | session | The org's own claims (newest first), with denormalized listing + restaurant info; returns `[]` for callers of the wrong org type. **`restaurantPhone` is server-side redacted to `null` unless claim status is `ACCEPTED` or `PICKED_UP`** — the value never reaches the client before then, regardless of UI logic. |
| `createClaimFn({id})` / `createAnimalClaimFn({id})` | verified org of matching type | Atomic Drizzle `db.transaction`: (1) `UPDATE food_listings SET status='CLAIM_REQUESTED' WHERE id=? AND status='AVAILABLE' AND food_category=<kind> AND pickup_end_time > NOW() AND expiry_time > NOW()` returning row — primary race guard + temporal guard for stale-but-still-AVAILABLE rows; (2) `INSERT INTO claims (..., status='PENDING')` — secondary guard via partial unique index `claims_listing_active_uq`. Throws user-friendly errors (`Listing not found` / `Only <category> food can be claimed by <org type>s` / `This listing has expired` / `This listing is no longer available to claim`). |

`requireVerifiedClaimantOrg(user, kind)`: generic gate. ADMIN bypasses the verification check but still needs to own an org of the expected type (no magic `claimantOrgId` for admins).

### Restaurant-side claim management (Accept / Reject + OTP)

The restaurant (donor) side of the claim workflow lives in
`src/lib/claim-server.ts` alongside the claimant flow. UI is in
`src/components/food/RestaurantClaimCard.tsx` plus the two routes listed
above (`/restaurant/claims`, `/restaurant/claims/$id`).

| Function | Auth | Purpose |
|----------|------|---------|
| `listClaimRequestsForRestaurantFn({scope})` | session | `scope` = `active` / `history` / `all`; filters via `cl.status = ANY($::claim_status[])` mapped to `ACTIVE_CLAIM_STATUSES` / `HISTORY_CLAIM_STATUSES`. Joins claimant org for name/type/phone/address. Returns `[]` for callers without a RESTAURANT org. |
| `getClaimForRestaurantFn({id})` | session, must own listing | throws `NOT_FOUND` (route catches and shows 404) when claim id doesn't belong to a listing owned by the caller's RESTAURANT org. Mirrors `getMyListingFn`'s "don't leak existence" pattern. |
| `acceptClaimFn({id})` | verified RESTAURANT, must own listing | atomic Drizzle `db.transaction`: (1) SELECT claim+listing, verify ownership + claim is `PENDING` + listing is `CLAIM_REQUESTED`; (2) UPDATE listing `CLAIM_REQUESTED`→`CLAIMED` + set `accepted_claim_id`, status-gated; (3) UPDATE claim `PENDING`→`ACCEPTED` + set 6-digit `otp_code`. Retries up to 5× on per-listing OTP collision (`23505` against `claims_listing_otp_uq`). |
| `rejectClaimFn({id})` | verified RESTAURANT, must own listing | atomic Drizzle `db.transaction`: (1) SELECT claim+listing, verify ownership + claim is `PENDING`; (2) UPDATE claim `PENDING`→`REJECTED`, status-gated; (3) if no other active claims remain on the listing AND the listing is still `CLAIM_REQUESTED`, UPDATE listing `CLAIM_REQUESTED`→`AVAILABLE` and clear `accepted_claim_id`. The "other active claims" check is defensive — `claims_listing_active_uq` already enforces a single active claim per listing today. |
| `verifyPickupFn({id, otp})` | verified RESTAURANT, must own listing | atomic Drizzle `db.transaction`: (1) SELECT claim+listing, verify ownership + claim is `ACCEPTED` + listing is `CLAIMED` + `otp_code` is set; (2) constant-time compare (`crypto.timingSafeEqual`) of submitted OTP against stored `otp_code`; (3) UPDATE claim `ACCEPTED`→`COMPLETED` + set `otp_verified_at`/`otp_verified_by`, status-gated; (4) UPDATE listing `CLAIMED`→`PICKED_UP` + set `delivered_at`, status- and ownership-gated. Wrong OTP throws `Incorrect OTP — please try again`; already-verified throws `This claim has already been verified`. The 6-digit input is stripped of non-digit characters server-side before validation. |

`requireVerifiedRestaurantOrg(user)` (in `claim-server.ts`): mirrors the
listing-server gate. ADMIN bypasses the verification check but still needs
to own a RESTAURANT org.

**OTP visibility / handoff model** (mirrors `WORKFLOW.md` step 7-9):
- Generated server-side as a 6-digit string (`000000`-`999999`) on Accept.
- **Receiver (NGO / Animal Rescue)** sees the value via `MyClaim.otpCode`,
  which is server-side redacted to `null` unless claim status is `ACCEPTED`,
  `PICKED_UP`, or `COMPLETED` (`OTP_VISIBLE_CLAIM_STATUSES`). Rendered
  prominently in `MyClaimCard` so they can show it at pickup, and kept
  visible after `COMPLETED` as a receipt of the handoff.
- **Donor (Restaurant)** never sees the value — only `RestaurantClaim.otpIssued`
  (a boolean) is sent to them. The donor enters the code at pickup via the
  `verifyPickupFn` flow on `/restaurant/claims/$id` (OTP input is a
  numeric-only `<input>` that strips non-digits both client- and
  server-side, then constant-time-compared to the stored `otp_code`).

**Restaurant dashboard** (`/restaurant/dashboard`) loads
`listClaimRequestsForRestaurantFn({scope:'active'})` in parallel with the
listing fetches and renders a "Pending claims" stat card (linking to
`/restaurant/claims`) plus a Claims quick-action button with a count badge.

`haversineKm(lat1, lng1, lat2, lng2)`: great-circle distance in km, exported from `claim-server.ts`. Pure TS — no PostGIS dependency.

Claim status sets live in `src/lib/permissions.ts`:
- `ACTIVE_CLAIM_STATUSES = ['PENDING', 'ACCEPTED', 'PICKED_UP']`
- `HISTORY_CLAIM_STATUSES = ['REJECTED', 'CANCELLED', 'COMPLETED']`
- `CANCELABLE_CLAIM_STATUSES = ['PENDING', 'ACCEPTED']`
- `CLAIM_STATUS_LABELS` / `CLAIM_STATUS_BADGE_CLASSES` for UI rendering

`canManageNgoClaims(user, org)` / `canManageAnimalClaims(user, org)`: stricter than `canClaim*Food` — caller must actually own an org of the matching type (admins included). Mirrors the server-side `requireVerifiedClaimantOrg` so the claim UI never appears for an admin who has no matching org to act on.

`fetchOrgForUser` (in `src/lib/org-server.ts`) is scoped to `member.role = 'owner'` so the route context's organization is always the user's owned org. This keeps UI gates and server-side `requireVerified*Org` mutation gates aligned even if a future invitation flow introduces non-owner memberships.

### Org server functions (`src/lib/org-server.ts`)

| Function | Auth | Purpose |
|----------|------|---------|
| `getMyOrganizationFn()` | session | returns the caller's org (joined via `member`) or `null` |
| `createMyOrganizationFn(data)` | session, non-admin | validates input, enforces type matches role, single-org-per-user, optional cityId FK check; raw INSERT into `organization` + `member` (role=`owner`) inside a tx; always sets `verificationStatus='PENDING'` |
| `listOrganizationsForAdminFn()` | ADMIN | lateral join to first owner; for `/admin/organizations` |
| `setOrganizationVerificationFn({organizationId, status})` | ADMIN | UPDATE `verificationStatus` + `verifiedAt` (set to NOW only on VERIFIED) |
| `listCitiesFn()` | session | active cities for the onboarding select |

### Single-org-per-user invariant (DB level)

To prevent a race condition where two concurrent onboarding submissions could both pass the app-level "do you already have an org?" pre-check and create two orgs, there is a unique partial index:

```sql
CREATE UNIQUE INDEX member_one_owner_per_user_uq
  ON "member" ("userId") WHERE role = 'owner';
```

The `member` INSERT inside `createMyOrganizationFn`'s transaction is the race guard: the second concurrent attempt hits a unique-violation (`23505`), the tx rolls back (no orphan org), and the user sees `Error: You already have an organization`. The index is partial on `role='owner'` so future Better Auth invitation flows can still add the user as a non-owner `member` to other orgs.

### Defense-in-depth at the auth layer (`src/lib/auth.ts` `hooks.before`)

Better Auth additionalFields with `input: true` are tamper-prone, so the request-level middleware enforces server-managed fields independently of `databaseHooks` (which doesn't fire for additionalFields on `update-user`):

- `/sign-up/email` → coerce `role` to `RESTAURANT` if not in `SIGNUP_ROLES`
- `/update-user` → strip `role` from body
- `/organization/create` → **rejected entirely** (org creation must go through `createMyOrganizationFn`)
- `/organization/update` → strip `verificationStatus`, `verifiedAt`, `type` (so existing org owners can't self-verify or re-type)

Admin promotion remains SQL-only:
```sql
UPDATE "user" SET role='ADMIN' WHERE email='you@example.com';
```

### Self-signup role coercion

The register form lets users pick RESTAURANT / NGO / ANIMAL_RESCUE. The `databaseHooks.user.create.before` in `src/lib/auth.ts` coerces any role outside that set (e.g. `ADMIN`, garbage values, missing) to `RESTAURANT`. ADMINs must be promoted manually via SQL — never via signup.

### Sign-out

The header in `src/components/DashboardShell.tsx` calls `signOut()` from `auth-client`, invalidates the router, and navigates to `/login`. Better Auth requires a matching `Origin` header — the browser sends this automatically; for curl tests use `-H "Origin: https://$REPLIT_DEV_DOMAIN"`.

### Required env vars

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres connection (auto-set by Replit) |
| `BETTER_AUTH_SECRET` | 32+ char secret for cookie signing |
| `BETTER_AUTH_URL` | (optional) Base URL override; otherwise inferred from `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` |

## Development

```bash
npm install
npm run dev        # Starts dev server on port 5000
npm run build      # Production build (output to .output/)
npm run test       # Run vitest tests
npm run lint       # ESLint
```

## Configuration

- **Dev server**: port 5000, host 0.0.0.0 (required for Replit preview)
- **Vite config**: `vite.config.ts` — allows all hosts for Replit proxy
- **Workflow**: "Start application" runs `npm run dev` on port 5000

## Deployment

- **Target**: Autoscale
- **Build**: `npm run build`
- **Run**: `node .output/server/index.mjs`
