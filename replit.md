# FoodSetu - TanStack Start App

## Overview

A TanStack Start (React + Vite + Nitro SSR) web application with file-based routing, Tailwind CSS v4, and TypeScript.

FoodSetu connects restaurants/hotels/bakeries that have surplus food with verified NGOs, shelters, and animal rescue groups. See **[WORKFLOW.md](./WORKFLOW.md)** for the full end-to-end product flow.

## QA & seed

- **`scripts/seed.ts`** — deterministic, idempotent QA seed. Provisions 1 admin, 3 PENDING orgs, 3 VERIFIED orgs, and 4 sample listings (one of which is past its pickup window for the expiry test). Password for every account: `password123`. Run with `npx tsx scripts/seed.ts`.
- **`scripts/qa.ts`** — end-to-end QA harness. Re-seeds, then walks the happy path (HUMAN_SAFE + ANIMAL_SAFE) and the negative scenarios (category isolation, verification gates, expiry handling, wrong OTP, admin org/listing management) with DB-state assertions. Run with `npx tsx scripts/qa.ts`.
- **`QA_REPORT.md`** — pass/fail table (43/43 currently passing) and per-area summary of every defect found and how it was fixed during the MVP QA pass.

## UI / Design System

Two distinct visual surfaces — kept separate on purpose:

1. **Public marketing routes** (`/`, `/listings`) — **"editorial almanac"** direction (this section).
2. **Authenticated dashboards** (`/restaurant/*`, `/ngo/*`, `/animal/*`, `/admin/*`) — Linear/Stripe-style enterprise shell (further down).

### Public routes (`src/routes/index.tsx`, `src/routes/listings.tsx`) — editorial almanac

A warm, paper-feel newsroom aesthetic. **No shadows anywhere on the public surface.** Hierarchy comes from typography, hairline rules, color tone, and SVG grain — never elevation.

**Type system**

- **Display:** Fraunces (Google Fonts, opsz/SOFT axes loaded in `src/routes/__root.tsx`). Used as `font-display` / `font-display-italic`. The italic axis carries the brand voice (e.g. _before_, _plainly_).
- **Body / UI:** Poppins (default `font-sans`).
- **Numbers:** always `tabular-nums`.

**Palette** (defined as `@theme` tokens in `src/styles.css`)

| Token                                                        | Use                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| `--color-paper` / `--color-paper-200` / `--color-paper-300`  | Page + section backgrounds (warm cream)              |
| `--color-rule`                                               | Hairline borders                                     |
| `--color-ink` / `--color-ink-700` / `--color-ink-500` / `-300` | Text scale (true ink → muted)                        |
| `--color-ember`                                               | Brand accent (orange-600 family, italics + dot CTAs) |

**Custom utilities** (in `src/styles.css`)

- `font-display`, `font-display-italic` — Fraunces wrappers with optical-size hint.
- `eyebrow` — `text-[11px] font-semibold uppercase tracking-[0.18em]` label.
- `hairline` — 1px rule with the rule color baked in.
- `paper-grain` — SVG `<feTurbulence>` noise overlay for paper texture.
- `ink-grain` — same noise on the dark ink CTA panel.
- `col-rules` — multi-column dotted vertical separators.
- `editorial-link` — body-text link with a dotted underline + ember hover.
- `marquee` keyframes for the top stats tape (`animate-marquee`).

**Recurring components** (defined inside the route files, not extracted)

- `TopTape` — thin marquee strip above the masthead with five running stats (live listings, partners, meals rescued, etc.).
- `BowlMark` — hand-drawn SVG bowl logotype.
- `RoundStamp` — rotating circular text stamp (`Fresh · Today · Claim`) — vintage typewriter feel.
- Roman-numeral chapter anchors (I–IV) at section heads + giant ghosted romans on Method blocks.
- `RowCard` / `FeatureCard` — listing entries with index numbers (`01`, `02`...) and hairline dividers.
- `Colophon` footer — typeset like a magazine masthead, takes `issueNumber` from the loader.

**Hard constraints (do not regress on the public surface)**

- ❌ no `shadow-*`, no `box-shadow`, no soft elevation tricks
- ❌ no fluid background gradients (a flat ink panel + grain is the only "depth")
- ✅ all photos use Unsplash with `w=800–1600&auto=format&fit=crop&q=80`
- ✅ chapter numerals (`I` / `II` / `III` / `IV`) lead each major section
- ✅ rounded shapes are either `rounded-full` (pills, stamps) or `rounded-[28px]` (large flat panels) — no in-between
- ✅ `ISSUE_NUMBER` is computed in the route loader (never at module top-level) so SSR + client always render the same week count

### Dashboard shell (`src/components/DashboardShell.tsx`) — Linear-style

- Fixed 260px sidebar on desktop, mobile drawer (with body-scroll lock + Escape-to-close).
- Role-driven nav (RESTAURANT / NGO / ANIMAL / ADMIN) with section labels.
- Org card with verification dot. User menu with sign-out at bottom (closes on outside click + Escape).
- Content max-width `1200px`.
- No shadows, no gradients. Hierarchy via `border-gray-200` + tone shifts + typography.
- `rounded-md` inputs/buttons/nav items, `rounded-lg` cards/panels.

### Tokens (both surfaces)

- **Primary**: `orange-600` (hover `orange-700`). Active nav `bg-orange-50 text-orange-700`.
- **Numbers**: always `tabular-nums`. Dashboard KPI values `text-[28px]`.
- **Eyebrow labels**: `text-[11px] font-semibold uppercase tracking-wider`.
- **Font**: Poppins via Tailwind v4 `@theme`.
- **Custom utility**: `scrollbar-hide` defined in `src/styles.css` for the category strip.

### Other components

- **AdminShell** (`src/components/admin/AdminShell.tsx`) — thin pass-through to DashboardShell that injects `role: 'ADMIN'`.
- **DashboardStatsCard** — supports `tone`, `hint`, `to`, optional `trend` indicator.

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

### Hydration / client-bundle hygiene (gotcha)

`vite.config.ts` ships a custom `stubServerOnlyForClient()` plugin that
intercepts client-side imports of `pg`, `src/db/index.ts`, and
`src/lib/auth.ts` and resolves them to virtual stub modules. SSR
(`opts.ssr === true`) is left untouched so the real implementations run
server-side. Without this, Vite's dep scanner walks every static `import { db }
from '../db'` in our `src/lib/*-server.ts` files (transitively reached from
`routeTree.gen.ts`) and pre-bundles `pg` into the **client** deps cache.
TanStack Start strips server-fn handler bodies on the client but not the
file-level imports, so pg evaluates in the browser, hits `Buffer is not
defined` / `EventEmitter undefined` / a `DATABASE_URL` throw, and kills React
hydration — leaving the SSR HTML inert (tabs/buttons appear dead).

A defense-in-depth `Buffer` polyfill is also injected in
`src/routes/__root.tsx` `<head>` via inline `<script>` (with
`suppressHydrationWarning` since the Replit dev preview proxy rewrites tags
inside `<head>`).

**All user-visible date/time strings must use `Intl.DateTimeFormat` with a
fixed `timeZone: 'Asia/Kolkata'`** (see `formatPickup` in `src/routes/index.tsx`
and `src/routes/listings.tsx`, `formatTime` in
`src/components/ui/FoodListingCard.tsx`). `toLocaleString(undefined, ...)`
hydrates differently on server vs client and triggers React 19 hydration
mismatches.

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

| Enum                  | Values                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `user_role`           | ADMIN, RESTAURANT, NGO, ANIMAL_RESCUE                                                                                |
| `org_type`            | RESTAURANT, NGO, ANIMAL_RESCUE                                                                                       |
| `food_category`       | HUMAN_SAFE, ANIMAL_SAFE, COMPOST_ONLY                                                                                |
| `food_listing_status` | DRAFT, AVAILABLE, CLAIM_REQUESTED, CLAIMED, PICKED_UP, EXPIRED, CANCELLED, REPORTED                                  |
| `claim_status`        | PENDING, ACCEPTED, REJECTED, CANCELLED, PICKED_UP, COMPLETED                                                         |
| `verification_status` | PENDING, VERIFIED, REJECTED, SUSPENDED                                                                               |
| `report_reason`       | SPOILED, MISLABELED, NO_SHOW, INAPPROPRIATE, OTHER                                                                   |
| `report_status`       | OPEN, REVIEWING, RESOLVED, DISMISSED (UI surfaces only OPEN, REVIEWED [↔ REVIEWING], RESOLVED — see Reports section) |
| `sms_purpose`         | OTP, NEW_LISTING_ALERT, CLAIM_ACCEPTED, PICKUP_REMINDER, GENERIC                                                     |
| `sms_status`          | QUEUED, SENT, DELIVERED, FAILED                                                                                      |

### Custom auth fields (managed by Better Auth)

- **`user.role`** (text, default `RESTAURANT`, `input: false` so clients can't self-elevate). Allowed values mirror `user_role` enum.
- **`organization`** extended fields: `type` (default `RESTAURANT`), `cityId`, `phone`, `address`, `description`, `latitude`, `longitude`, `verificationStatus` (default `PENDING`, one of `PENDING|VERIFIED|REJECTED|SUSPENDED`), `verifiedAt`.

### Running migrations

After editing `src/lib/auth.ts` (auth tables / plugins / additional fields):

```bash
npx @better-auth/cli migrate -y   # uses pinned devDependency
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

### Post-merge contract (`scripts/post-merge.sh`)

Runs automatically after every task merge. Order matters:

1. `npm install` — installs pinned versions including `@better-auth/cli` (devDep).
2. `drizzle-kit migrate` — additive only. **Never use `drizzle-kit push --force`** here; it drops Better Auth tables (they're not in `src/db/schema.ts`).
3. `@better-auth/cli migrate -y` — pinned version, syncs auth tables.
4. Idempotent SQL patch — Better Auth maps `type: 'number'` to `integer`, but `organization.latitude/longitude` need decimal precision, so the script alters them to `numeric(10,7)` only when they're still integer.

If a fresh DB ever loses migration tracking (existing tables but empty `drizzle.__drizzle_migrations`), backfill with the sha256 of each `drizzle/NNNN_*.sql` — keep this as a one-off runbook, **not** as a regular migration.

### Health check

`GET /api/auth/ok` → `{"ok":true}`.

## Routes & role-based access

Public routes (under `src/routes/`):

- `/` — landing page (shows different nav based on `useSession()`)
- `/login`, `/register` — auth pages; if already signed in, redirect to the user's dashboard
- `/api/auth/$` — Better Auth handler (catch-all)

Protected routes live under the pathless layout `src/routes/_authed.tsx`. Its `beforeLoad` calls a server function (`getServerSession` in `src/lib/auth-server.ts`) which reads the cookie via `auth.api.getSession({ headers })`. If no session, it redirects to `/login?redirect=<original-href>` and the login page honors that on success. On success it returns `{ user, sessionId }` into route context.

Each dashboard route adds its own `beforeLoad` doing a plain role check (NOT the verification-aware `canX` helpers, which gate _actions_ not _navigation_) and redirecting to `roleToDashboard(user.role)` on mismatch:

| Route                      | Allowed roles            | Notes                                                                 |
| -------------------------- | ------------------------ | --------------------------------------------------------------------- |
| `/admin/dashboard`         | ADMIN                    | 9-stat overview + sidebar nav                                         |
| `/admin/users`             | ADMIN                    | searchable user table, role filter chips                              |
| `/admin/organizations`     | ADMIN                    | review table; verify / reject / suspend / reset                       |
| `/admin/listings`          | ADMIN                    | all food listings + admin-cancel                                      |
| `/admin/claims`            | ADMIN                    | all claims across the platform                                        |
| `/admin/reports`           | ADMIN                    | report queue: mark reviewed / resolve / re-open                       |
| `/reports`                 | any logged-in user       | Caller-visible reports (filed by them or about their listings/claims) |
| `/reports/new`             | any logged-in user       | File a new report; accepts `?listingId=` and `?claimId=` query params |
| `/admin/cities`            | ADMIN                    | create / edit / enable / disable cities                               |
| `/restaurant/dashboard`    | RESTAURANT, ADMIN        | gated by org verification for actions                                 |
| `/ngo/dashboard`           | NGO, ADMIN               | gated by org verification for actions                                 |
| `/animal/dashboard`        | ANIMAL_RESCUE, ADMIN     | gated by org verification for actions                                 |
| `/onboarding/organization` | non-ADMIN without an org | one-time profile setup                                                |

After `signIn.email`, the login page navigates to `roleToDashboard(user.role)`. Same after `signUp.email` (auto-sign-in is enabled).

### Organization onboarding & verification

Non-admin users (RESTAURANT, NGO, ANIMAL_RESCUE) **must** create an organization profile before they can act. Flow lives in `src/routes/_authed.tsx` → it fetches the user's org via `getMyOrganizationFn` (`src/lib/org-server.ts`) and:

- if no org and not on `/onboarding/organization` → 307 to `/onboarding/organization`
- if has org and on `/onboarding/organization` → 307 to their dashboard
- if ADMIN and on `/onboarding/organization` → 307 to `/admin/dashboard`

The org `type` is auto-derived from the user's role and shown read-only on the form (so RESTAURANT users can only ever create RESTAURANT orgs, etc.). Cities are fetched from the `cities` table (5 are seeded: Bengaluru, Mumbai, Delhi, Chennai, Hyderabad).

Verification has four states (`VERIFICATION_STATUSES`):

| Status      | Banner shown to user            | Actions allowed        |
| ----------- | ------------------------------- | ---------------------- |
| `PENDING`   | "Awaiting verification" (amber) | none                   |
| `VERIFIED`  | none (green badge in header)    | role's full action set |
| `REJECTED`  | "Verification rejected" (red)   | none                   |
| `SUSPENDED` | "Account suspended" (gray)      | none                   |

`canCreateFoodListing(user, org)`, `canClaimHumanFood(user, org)`, `canClaimAnimalFood(user, org)` all require `org.verificationStatus === 'VERIFIED'` for non-admins. `ADMIN` bypasses the org+verification requirement entirely (and never goes through onboarding).

### Restaurant food listings

Routes (under `src/routes/_authed/restaurant/`):

| Route                           | Purpose                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/restaurant/dashboard`         | Stats cards (active/history listings, pending claims) + quick actions + recent active listings |
| `/restaurant/listings`          | Active/history tabbed table                                                                    |
| `/restaurant/listings/new`      | Create form (verification gate inside page)                                                    |
| `/restaurant/listings/$id`      | Detail view + Cancel button + Edit link                                                        |
| `/restaurant/listings/$id/edit` | Edit form (locked when status not editable)                                                    |
| `/restaurant/claims`            | Active/history tabbed list of incoming claim requests with inline Accept/Reject                |
| `/restaurant/claims/$id`        | Claim detail view (claimant org + listing) with Accept/Reject decision panel                   |

All routes use a plain role check (`RESTAURANT|ADMIN`) in `beforeLoad`. The verification gate is checked inside the page render (via `canCreateFoodListing`) — same pattern as the dashboard, to avoid redirect loops.

Server fns live in `src/lib/listing-server.ts`:

| Function                      | Auth                          | Purpose                                                                                                                 |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `listMyListingsFn({scope})`   | session                       | `scope` = `active`/`history`/`all`; returns `[]` for non-restaurant or no-org users                                     |
| `getMyListingFn({id})`        | session, must own             | throws `NOT_FOUND` if not owned (route catches and shows 404)                                                           |
| `createListingFn(data)`       | verified RESTAURANT           | sets `status=AVAILABLE`, inherits `cityId` from org, `restaurantId=org.id`                                              |
| `updateListingFn({id, data})` | verified RESTAURANT, must own | atomic UPDATE WHERE `status IN (DRAFT, AVAILABLE)` AND ownership; disambiguates "not found" vs "wrong status" on no-row |
| `cancelListingFn({id})`       | verified RESTAURANT, must own | atomic UPDATE → `CANCELLED` WHERE `status IN (DRAFT, AVAILABLE)` AND ownership                                          |

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

| Kind          | Org type        | Food category | Routes                                                          |
| ------------- | --------------- | ------------- | --------------------------------------------------------------- |
| `NGO_KIND`    | `NGO`           | `HUMAN_SAFE`  | `/ngo/dashboard`, `/ngo/nearby-food`, `/ngo/my-claims`          |
| `ANIMAL_KIND` | `ANIMAL_RESCUE` | `ANIMAL_SAFE` | `/animal/dashboard`, `/animal/nearby-food`, `/animal/my-claims` |

Routes (under `src/routes/_authed/{ngo,animal}/`):

| Route           | Purpose                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `…/dashboard`   | Stat cards (nearby/active/total claims) + quick actions + previews of nearby food and active claims   |
| `…/nearby-food` | Card grid of category-matched + AVAILABLE listings with distance/pickup/expiry; Claim button per card |
| `…/my-claims`   | Active/history tabbed cards; restaurant phone revealed only after claim is `ACCEPTED` or `PICKED_UP`  |

All claim routes use a plain role check (`NGO|ADMIN` or `ANIMAL_RESCUE|ADMIN`) in `beforeLoad`. The verification gate is checked inside the page render (via `canManageNgoClaims` / `canManageAnimalClaims`) — same pattern as restaurant routes, to avoid redirect loops.

**Shared UI components** (`src/components/food/`):

| Component            | Used by                                   | Purpose                                                                                                                                                              |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NearbyFoodCard`     | `…/nearby-food` (both flows)              | Renders one listing card with title/quantity/type/pickup/expires/distance/area + Claim button. Exports `formatTime`, `formatDistance`, `formatDistanceLong` helpers. |
| `MyClaimCard`        | `…/my-claims` (both flows)                | Renders one claim card with status badge, listing details, and a `tel:` link when `restaurantPhone` is non-null (i.e. server says claim is ACCEPTED/PICKED_UP).      |
| `StatCard`, `TabBtn` | `…/dashboard`, `…/my-claims` (both flows) | Reusable stat card and active/history tab pill.                                                                                                                      |

Server fns live in `src/lib/claim-server.ts`. Internal helpers
(`listNearbyFoodForKind`, `listMyClaimsForKind`, `createClaimForKind`) take a
`ClaimantKind` so logic is written once. Six exported server fns wrap them:

| Function                                               | Auth                          | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listNearbyHumanFoodFn()` / `listNearbyAnimalFoodFn()` | session                       | Returns `[]` for callers without a verified org of the matching type, or whose org has no `latitude`/`longitude` set (geo-matching requires an origin). Delegates to `getNearbyListings` from `src/lib/geo-server.ts` (10 km default radius, top 50). **Restaurant phone is intentionally NOT selected — contact info is gated behind an accepted claim.** Sorted by `expiryTime` asc (urgency wins) then distance asc (tiebreaker).                                                                                                                                                                            |
| `listMyClaimsFn()` / `listMyAnimalClaimsFn()`          | session                       | The org's own claims (newest first), with denormalized listing + restaurant info; returns `[]` for callers of the wrong org type. **`restaurantPhone` is server-side redacted to `null` unless claim status is `ACCEPTED` or `PICKED_UP`** — the value never reaches the client before then, regardless of UI logic.                                                                                                                                                                                                                                                                                            |
| `createClaimFn({id})` / `createAnimalClaimFn({id})`    | verified org of matching type | Atomic Drizzle `db.transaction`: (1) `UPDATE food_listings SET status='CLAIM_REQUESTED' WHERE id=? AND status='AVAILABLE' AND food_category=<kind> AND pickup_end_time > NOW() AND expiry_time > NOW()` returning row — primary race guard + temporal guard for stale-but-still-AVAILABLE rows; (2) `INSERT INTO claims (..., status='PENDING')` — secondary guard via partial unique index `claims_listing_active_uq`. Throws user-friendly errors (`Listing not found` / `Only <category> food can be claimed by <org type>s` / `This listing has expired` / `This listing is no longer available to claim`). |

`requireVerifiedClaimantOrg(user, kind)`: generic gate. ADMIN bypasses the verification check but still needs to own an org of the expected type (no magic `claimantOrgId` for admins).

### Restaurant-side claim management (Accept / Reject + OTP)

The restaurant (donor) side of the claim workflow lives in
`src/lib/claim-server.ts` alongside the claimant flow. UI is in
`src/components/food/RestaurantClaimCard.tsx` plus the two routes listed
above (`/restaurant/claims`, `/restaurant/claims/$id`).

| Function                                    | Auth                                  | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listClaimRequestsForRestaurantFn({scope})` | session                               | `scope` = `active` / `history` / `all`; filters via `cl.status = ANY($::claim_status[])` mapped to `ACTIVE_CLAIM_STATUSES` / `HISTORY_CLAIM_STATUSES`. Joins claimant org for name/type/phone/address. Returns `[]` for callers without a RESTAURANT org.                                                                                                                                                                                                                                                                                                                                                                                             |
| `getClaimForRestaurantFn({id})`             | session, must own listing             | throws `NOT_FOUND` (route catches and shows 404) when claim id doesn't belong to a listing owned by the caller's RESTAURANT org. Mirrors `getMyListingFn`'s "don't leak existence" pattern.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `acceptClaimFn({id})`                       | verified RESTAURANT, must own listing | atomic Drizzle `db.transaction`: (1) SELECT claim+listing, verify ownership + claim is `PENDING` + listing is `CLAIM_REQUESTED`; (2) UPDATE listing `CLAIM_REQUESTED`→`CLAIMED` + set `accepted_claim_id`, status-gated; (3) UPDATE claim `PENDING`→`ACCEPTED` + set 6-digit `otp_code`. Retries up to 5× on per-listing OTP collision (`23505` against `claims_listing_otp_uq`).                                                                                                                                                                                                                                                                     |
| `rejectClaimFn({id})`                       | verified RESTAURANT, must own listing | atomic Drizzle `db.transaction`: (1) SELECT claim+listing, verify ownership + claim is `PENDING`; (2) UPDATE claim `PENDING`→`REJECTED`, status-gated; (3) if no other active claims remain on the listing AND the listing is still `CLAIM_REQUESTED`, UPDATE listing `CLAIM_REQUESTED`→`AVAILABLE` and clear `accepted_claim_id`. The "other active claims" check is defensive — `claims_listing_active_uq` already enforces a single active claim per listing today.                                                                                                                                                                                |
| `verifyPickupFn({id, otp})`                 | verified RESTAURANT, must own listing | atomic Drizzle `db.transaction`: (1) SELECT claim+listing, verify ownership + claim is `ACCEPTED` + listing is `CLAIMED` + `otp_code` is set; (2) constant-time compare (`crypto.timingSafeEqual`) of submitted OTP against stored `otp_code`; (3) UPDATE claim `ACCEPTED`→`COMPLETED` + set `otp_verified_at`/`otp_verified_by`, status-gated; (4) UPDATE listing `CLAIMED`→`PICKED_UP` + set `delivered_at`, status- and ownership-gated. Wrong OTP throws `Incorrect OTP — please try again`; already-verified throws `This claim has already been verified`. The 6-digit input is stripped of non-digit characters server-side before validation. |

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
  Critically, **all restaurant-side mutations (`acceptClaimFn`,
  `rejectClaimFn`, `verifyPickupFn`) return a sanitized
  `{ ok, id, status }` payload** rather than the raw claim row, so the OTP
  is never leaked through a mutation response either.

**Restaurant dashboard** (`/restaurant/dashboard`) loads
`listClaimRequestsForRestaurantFn({scope:'active'})` in parallel with the
listing fetches and renders a "Pending claims" stat card (linking to
`/restaurant/claims`) plus a Claims quick-action button with a count badge.

### Geo-matching (`src/lib/geo-server.ts`)

Reusable, context-free geo-matching primitives shared by every nearby-food
surface (NGO feed, animal-rescue feed, future map view, dashboard widgets).

| Export                                                                                  | Purpose                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `haversineKm(lat1, lng1, lat2, lng2)`                                                   | Great-circle distance in km. Pure TS — no PostGIS dependency. Re-exported from `claim-server.ts` for backward compat.                                                                                                                                                                     |
| `getNearbyListings({ latitude, longitude, radiusKm?, foodCategory, limit? })`           | Returns `AVAILABLE`, non-expired listings of `foodCategory` within `radiusKm` of the origin, enriched with restaurant info + `distanceKm`. Defaults: `radiusKm = 10`, `limit = 50` (capped at `MAX_NEARBY_LIMIT = 200`). Sort: expiry soonest first, then nearest distance as tiebreaker. |
| `DEFAULT_RADIUS_KM` (`10`) / `DEFAULT_NEARBY_LIMIT` (`50`) / `MAX_NEARBY_LIMIT` (`200`) | Tunables.                                                                                                                                                                                                                                                                                 |

`getNearbyListings` is **deliberately auth-free** so it can be reused from
any caller — auth/role/org gating is the caller's job. Today it's wrapped by
`listNearbyFoodForKind` in `claim-server.ts`, which adds:

1. Org type + verification gate (`NGO`→`HUMAN_SAFE`, `ANIMAL_RESCUE`→`ANIMAL_SAFE`).
2. Stale-listing sweep via `safeExpireOldListings()` before the SELECT.
3. Returns `[]` (instead of throwing) when the org has no location set —
   geo-matching is meaningless without an origin point. The route surfaces
   a "set your location" prompt in that case.

Implementation: bounding-box pre-filter in SQL (`lat BETWEEN ? AND ? AND
lng BETWEEN ? AND ?`, derived from `radiusKm / 111` for lat and
`radiusKm / (111*cos(lat))` for lng), then exact Haversine in app code to
honor the radius precisely. The bounding box is approximate (over-includes
corners and degrades near the poles) so the exact pass is required.

Claim status sets live in `src/lib/permissions.ts`:

- `ACTIVE_CLAIM_STATUSES = ['PENDING', 'ACCEPTED', 'PICKED_UP']`
- `HISTORY_CLAIM_STATUSES = ['REJECTED', 'CANCELLED', 'COMPLETED']`
- `CANCELABLE_CLAIM_STATUSES = ['PENDING', 'ACCEPTED']`
- `CLAIM_STATUS_LABELS` / `CLAIM_STATUS_BADGE_CLASSES` for UI rendering

`canManageNgoClaims(user, org)` / `canManageAnimalClaims(user, org)`: stricter than `canClaim*Food` — caller must actually own an org of the matching type (admins included). Mirrors the server-side `requireVerifiedClaimantOrg` so the claim UI never appears for an admin who has no matching org to act on.

`fetchOrgForUser` (in `src/lib/org-server.ts`) is scoped to `member.role = 'owner'` so the route context's organization is always the user's owned org. This keeps UI gates and server-side `requireVerified*Org` mutation gates aligned even if a future invitation flow introduces non-owner memberships.

### Admin dashboard (`/admin/*`)

All admin routes live under `src/routes/_authed/admin/` and gate via
`canAccessAdmin(user)` in `beforeLoad` (non-admins are redirected to their
own role dashboard via `roleToDashboard`). They share three reusable
building blocks in `src/components/admin/`:

| Component         | Purpose                                                                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminShell`      | Wraps `DashboardShell` (passes `organization={null}` because admins never own one) and adds a left sidebar nav highlighting the active route. Single source of truth for the 7 nav items.                             |
| `StatCard`        | Icon + label + big value + optional hint + optional `to` link + tone (`default`/`success`/`warning`/`danger`). Used on the dashboard grid.                                                                            |
| `AdminTable<T,F>` | Generic table that takes `rows`, `columns: Column<T>[]`, optional `filters: FilterChip<F>[]` + `searchKeys`. Renders the chip row, the search box (in-memory filter), the table itself, and an `N of M` count footer. |
| `StatusPill`      | Tiny rounded badge — used wherever a status string + colour ring needs rendering.                                                                                                                                     |

Server functions live in `src/lib/admin-server.ts`. Every one calls
`requireAdmin()` first (rejects with `UNAUTHORIZED` / `FORBIDDEN`):

| Function                                                                  | Returns                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getAdminStatsFn()`                                                       | `{ totalUsers, totalRestaurants, totalNgos, totalAnimalRescues, activeListings, completedPickups, expiredListings, pendingVerificationRequests, rescuedFoodByUnit[] }` — all counts in parallel via `Promise.all`. Org-type counts come from `"organization" GROUP BY type`. `rescuedFoodByUnit` is `SUM(quantity) GROUP BY quantity_unit WHERE status='PICKED_UP'`. |
| `listUsersForAdminFn()`                                                   | `[{ id, name, email, role, emailVerified, createdAt, orgId, orgName, orgType, orgVerificationStatus }]` via lateral join to the user's owner-membership (LIMIT 500).                                                                                                                                                                                                 |
| `listListingsForAdminFn()`                                                | All listings + restaurant/city joins (LIMIT 500).                                                                                                                                                                                                                                                                                                                    |
| `listClaimsForAdminFn()`                                                  | All claims + listing + restaurant + claimant joins (LIMIT 500).                                                                                                                                                                                                                                                                                                      |
| `listReportsForAdminFn()`                                                 | All reports + listing + reporter user/org joins (LIMIT 500).                                                                                                                                                                                                                                                                                                         |
| `setReportStatusFn({ id, status })`                                       | Atomic `UPDATE reports SET status, resolved_at = (NOW if RESOLVED/DISMISSED else NULL)`. Returns `{ ok, id, status }`.                                                                                                                                                                                                                                               |
| `adminCancelListingFn({ id })`                                            | Transactional: `SELECT … FOR UPDATE` → reject if status not in `DRAFT/AVAILABLE/CLAIM_REQUESTED/CLAIMED/REPORTED` → `UPDATE claims SET status='CANCELLED' WHERE listing_id = $ AND status IN ('PENDING','ACCEPTED','PICKED_UP')` (frees `claims_listing_active_uq`) → `UPDATE food_listings SET status='CANCELLED', accepted_claim_id=NULL`.                         |
| `listCitiesForAdminFn()`                                                  | All cities (active + inactive) ordered by state, name.                                                                                                                                                                                                                                                                                                               |
| `createCityFn({ name, state, country, latitude?, longitude?, isActive })` | INSERT with auto-slug `<name>-<state>-<6-hex>`.                                                                                                                                                                                                                                                                                                                      |
| `updateCityFn({ id, … })`                                                 | Same fields as create; preserves slug (slug isn't user-facing).                                                                                                                                                                                                                                                                                                      |
| `toggleCityActiveFn({ id, isActive })`                                    | Flips `is_active`. Disabled cities stay referenced by existing orgs/listings but disappear from new sign-up dropdowns (the public `listCitiesFn` filters `is_active = true`).                                                                                                                                                                                        |

The dashboard's "rescued food" stat is heterogeneous on purpose — quantities
are recorded in different units (`kg`, `meals`, `plates`, …) so the card
shows the top three units side by side rather than a misleading single
total.

`adminCancelListingFn` mirrors the restaurant-side cancel atomicity but
with a wider allowed status set (a restaurant can only cancel `DRAFT` /
`AVAILABLE`; an admin can additionally cancel `CLAIM_REQUESTED` /
`CLAIMED` / `REPORTED` for unsafe-food situations and frees any active
claim row in the same transaction so the claimant doesn't get stuck).

### Reports

The reports system lets any logged-in user flag a problem against a
listing, claim, or organization. Admins triage the queue; the listing
owner / claimant org sees reports relevant to them.

**Schema** (`reports` table — Drizzle-owned):

| Column                                           | Notes                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `food_listing_id`                                | **Nullable** (migration `0003_reports_listing_nullable.sql`) so reports about a fake org or generic platform issues can be filed without a linked listing. Most reports do reference a listing because the form is opened from listing-context surfaces. |
| `claim_id`                                       | Nullable. When the form is opened from a claim card, both `listingId` and `claimId` are sent; if only `claimId` is present `createReportFn` derives the `food_listing_id` from the claim.                                                                |
| `reporter_id`, `reporter_org_id`                 | Caller's user id + their owned org (if any).                                                                                                                                                                                                             |
| `reason`, `status`, `description`, `resolved_at` | See enum mapping below.                                                                                                                                                                                                                                  |

**Enum mapping** (the user-facing labels intentionally differ from the
DB enum values, kept stable to avoid a destructive migration):

| Spec label        | DB `report_reason` |
| ----------------- | ------------------ |
| Unsafe food       | `SPOILED`          |
| Wrong quantity    | `MISLABELED`       |
| Pickup no-show    | `NO_SHOW`          |
| Fake organization | `INAPPROPRIATE`    |
| Other issue       | `OTHER`            |

| Spec status        | DB `report_status`                                             |
| ------------------ | -------------------------------------------------------------- |
| `OPEN`             | `OPEN`                                                         |
| `REVIEWED`         | `REVIEWING`                                                    |
| `RESOLVED`         | `RESOLVED`                                                     |
| _(legacy, hidden)_ | `DISMISSED` (surfaced as `RESOLVED` in the UI; not selectable) |

`reportStatusToDb` / `reportStatusFromDb` in `src/lib/permissions.ts`
translate at the DB boundary. The constants `REPORT_REASONS`,
`REPORT_REASON_LABELS`, `REPORT_STATUSES`, `REPORT_STATUS_LABELS`,
`REPORT_STATUS_BADGE_CLASSES` are the single source of truth for UI.

**Server fns** (`src/lib/report-server.ts`):

| Function                                                          | Auth    | Purpose                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createReportFn({reason, description, foodListingId?, claimId?})` | session | Inserts an `OPEN` report. Defensive existence checks on the listing/claim id (so client typos return a friendly error instead of FK 500). When only `claimId` is supplied, derives `food_listing_id` from the claim so owner-side visibility (rule 3) still works. Description is required when reason is `OTHER`. |
| `listMyVisibleReportsFn()`                                        | session | Returns reports where the caller is the reporter, OR the caller's owned org owns the listing, OR the caller's owned org filed the linked claim. Adds a `visibility: 'FILED_BY_ME' \| 'ABOUT_MY_LISTING' \| 'ABOUT_MY_CLAIM'` discriminator (priority in that order) so the UI can label why each row is visible.   |

**Admin server fns** (in `src/lib/admin-server.ts`):

| Function                          | Notes                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listReportsForAdminFn()`         | Joins listing + reporter user + reporter org. Translates DB `status` to UI `status` via `reportStatusFromDb`.                                                                                                                                                                                                                                                                       |
| `setReportStatusFn({id, status})` | Validates the new status with `isValidReportStatus` (3 values only), translates to DB enum, sets `resolved_at = NOW()` only when transitioning to `RESOLVED`.                                                                                                                                                                                                                       |
| `listListingsForAdminFn()`        | Now returns a `reportCount` per row via a `LEFT JOIN (SELECT food_listing_id, COUNT(*)::int AS n FROM reports GROUP BY food_listing_id)` subquery. The admin listings table renders a `REPORTED (n)` flag-icon pill next to the title when `reportCount > 0` (per spec rule 4 — independent of whether the listing's own `food_listing_status` was manually flipped to `REPORTED`). |

**Routes**:

| Route              | Component                              | Notes                                                                                                                                                                                                                                            |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/reports/new`     | `src/routes/_authed/reports/new.tsx`   | Radio-button reason picker (5 options with explanatory hints), 2000-char description textarea, optional context block showing the linked `listingId`/`claimId` from the query string. On submit shows a success state with a link to `/reports`. |
| `/reports` (index) | `src/routes/_authed/reports/index.tsx` | Cards list of `listMyVisibleReportsFn()` output, each tagged with a small visibility pill. Admins additionally see a button into `/admin/reports`.                                                                                               |
| `/admin/reports`   | `src/routes/_authed/admin/reports.tsx` | Filter chips (All / Open / Reviewed / Resolved), search box, action buttons that drive `setReportStatusFn`: "Mark reviewed" (OPEN → REVIEWED), "Resolve" (any → RESOLVED), "Re-open" (RESOLVED → OPEN).                                          |

**UI entry points** (where users can file a report):

| Surface                                           | Prefilled context       |
| ------------------------------------------------- | ----------------------- |
| `MyClaimCard` (NGO + Animal Rescue `…/my-claims`) | `listingId` + `claimId` |
| `/restaurant/claims/$id` aside                    | `listingId` + `claimId` |
| `DashboardShell` header (visible to all roles)    | none — opens `/reports` |

The DashboardShell header gains a small "Reports" link that routes to
`/reports` so any logged-in user can find their report queue from any
shell-wrapped page.

### Notifications (SMS / WhatsApp placeholder)

`src/lib/notification-server.ts` is a placeholder notification service —
no real SMS / WhatsApp provider is wired up yet. Every "send" call writes
a row into the existing `sms_logs` table (status=`SENT`, `sent_at=now()`)
and prints a one-line trace to stdout (`[notify:sms] to=… purpose=… …`).
When you're ready to plug in Twilio / Vonage / MSG91 / etc., swap the
`dispatch()` internals for a real client call — every other module keeps
working unchanged.

**Channel encoding**: `sms_logs` has no dedicated channel column today,
so the channel is encoded as a `[SMS]` / `[WhatsApp]` prefix on the
stored body. Easy to grep, easy to migrate to a real column later.

**Failure isolation**: every `notify*` and `send*Placeholder` call is
wrapped in try/catch and returns a result object — they never throw.
Callers use `void notify*()` so the main user flow (listing creation,
claim accept, OTP issue, pickup verify) never blocks on or rolls back
because of a logging blip. Notifications fire **after** the relevant
DB transaction commits.

| Primitive                                        | Purpose                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `sendSmsPlaceholder(phone, message, opts?)`      | Inserts one row into `sms_logs` with body `[SMS] <message>`.                                                           |
| `sendWhatsAppPlaceholder(phone, message, opts?)` | Same but body `[WhatsApp] <message>`.                                                                                  |
| `SendOptions`                                    | `{ purpose?, relatedListingId?, relatedClaimId? }` — `purpose` maps to the `sms_purpose` enum (defaults to `GENERIC`). |

The five spec'd events each have a high-level helper that resolves the
recipient phone number(s) from the auth-managed `organization` table and
fans out via **both** channels (SMS + WhatsApp), so once a real provider
is wired in the user can be reached on whichever they prefer:

| Event                   | Helper                                    | Recipient                                                                                                                                              | `sms_purpose`       |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| 1. Food listing created | `notifyFoodListingCreated(listing)`       | All verified `NGO` orgs (for `HUMAN_SAFE`) or `ANIMAL_RESCUE` orgs (for `ANIMAL_SAFE`) with a phone on file, capped at 100. Donor restaurant excluded. | `NEW_LISTING_ALERT` |
| 2. Claim requested      | `notifyClaimRequested(claim, listing)`    | Donor restaurant org's phone                                                                                                                           | `GENERIC`           |
| 3. Claim accepted       | `notifyClaimAccepted(claim, listing)`     | Claimant org's phone — includes donor's contact info                                                                                                   | `CLAIM_ACCEPTED`    |
| 4. OTP generated        | `notifyOtpGenerated(claim, listing, otp)` | Claimant org's phone — includes the 6-digit OTP value                                                                                                  | `OTP`               |
| 5. Pickup completed     | `notifyPickupCompleted(claim, listing)`   | Both donor and claimant orgs (separate sends)                                                                                                          | `GENERIC`           |

Hook points (all are `void notify…(…)` after the relevant tx commits, so
nothing in the user's request path can be rolled back by a notification
failure):

| Server fn                                                                                              | Event(s) fired                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createListingFn` (`src/lib/listing-server.ts`)                                                        | `notifyFoodListingCreated`                                                                                                                            |
| `createClaimForKind` (`src/lib/claim-server.ts`, used by both `createClaimFn` + `createAnimalClaimFn`) | `notifyClaimRequested`                                                                                                                                |
| `acceptClaimFn` (`src/lib/claim-server.ts`)                                                            | `notifyClaimAccepted` + `notifyOtpGenerated` (the OTP value is captured via a closure inside the tx — it still never reaches the donor-side response) |
| `verifyPickupFn` (`src/lib/claim-server.ts`)                                                           | `notifyPickupCompleted`                                                                                                                               |

**Note on OTP storage in `sms_logs`**: the OTP value is currently saved
to `sms_logs.body` so the placeholder can render the full would-be
message. When you wire a real provider, consider redacting the body and
only sending the cleartext OTP to the carrier API.

### Listing expiry sweep (`src/lib/expiry-server.ts`)

Listings carry an `expiry_time`. There is no cron yet, so the sweep is
piggy-backed onto hot-path data fetches and runs as a single atomic SQL
statement:

```sql
WITH expired AS (
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
SELECT (SELECT COUNT(*) FROM expired)   AS expired_listings,
       (SELECT COUNT(*) FROM cancelled) AS cancelled_claims;
```

Transition rules:

| From                                                                 | Condition                                              | Becomes   | Side effect                                                                  |
| -------------------------------------------------------------------- | ------------------------------------------------------ | --------- | ---------------------------------------------------------------------------- |
| `AVAILABLE`                                                          | `expiry_time <= NOW()`                                 | `EXPIRED` | —                                                                            |
| `CLAIM_REQUESTED`                                                    | `expiry_time <= NOW()` (only `PENDING` claim attached) | `EXPIRED` | The `PENDING` claim moves to `CANCELLED`, freeing `claims_listing_active_uq` |
| `CLAIMED`                                                            | _any_                                                  | unchanged | A donor has already accepted; the OTP/handoff flow continues                 |
| `DRAFT` / terminal (`PICKED_UP`, `EXPIRED`, `CANCELLED`, `REPORTED`) | _any_                                                  | unchanged | —                                                                            |

Two exports:

| Function                  | Purpose                                                                                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expireOldListings()`     | Returns `{ expiredListings, cancelledClaims }`. Throws on DB errors. Suitable for a future cron entry where you want failures surfaced.                                                                                          |
| `safeExpireOldListings()` | Throttled (≤ 1 sweep / 30 s per server instance), coalesces concurrent calls onto a single in-flight promise, and swallows errors with a `console.error` log. Suitable for fire-and-forget invocation from page-load server fns. |

Wired into the server fns that back the public-facing lists, so the UI
reflects expiry without needing a cron:

| Caller                                                                    | Why                                                                                                                                                 |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `listNearbyHumanFoodFn` / `listNearbyAnimalFoodFn` (in `claim-server.ts`) | NGO + animal "Nearby food" feeds — claimants never see a stale row, and the temporal guard inside `createClaimForKind` is a second line of defence. |
| `listMyListingsFn` (in `listing-server.ts`)                               | `/restaurant/listings` — restaurants see expired items move into the history tab as soon as they navigate.                                          |
| `listListingsForAdminFn` (in `admin-server.ts`)                           | `/admin/listings` — the admin's `EXPIRED` filter chip stays accurate.                                                                               |

A future scheduled job can call `expireOldListings()` directly to run the
same logic on a timer; nothing else needs to change.

### Org server functions (`src/lib/org-server.ts`)

| Function                                                  | Auth               | Purpose                                                                                                                                                                                                      |
| --------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `getMyOrganizationFn()`                                   | session            | returns the caller's org (joined via `member`) or `null`                                                                                                                                                     |
| `createMyOrganizationFn(data)`                            | session, non-admin | validates input, enforces type matches role, single-org-per-user, optional cityId FK check; raw INSERT into `organization` + `member` (role=`owner`) inside a tx; always sets `verificationStatus='PENDING'` |
| `listOrganizationsForAdminFn()`                           | ADMIN              | lateral join to first owner; for `/admin/organizations`                                                                                                                                                      |
| `setOrganizationVerificationFn({organizationId, status})` | ADMIN              | UPDATE `verificationStatus` + `verifiedAt` (set to NOW only on VERIFIED)                                                                                                                                     |
| `listCitiesFn()`                                          | session            | active cities for the onboarding select                                                                                                                                                                      |

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

| Var                  | Purpose                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Postgres connection (auto-set by Replit)                                                     |
| `BETTER_AUTH_SECRET` | 32+ char secret for cookie signing                                                           |
| `BETTER_AUTH_URL`    | (optional) Base URL override; otherwise inferred from `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` |

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
