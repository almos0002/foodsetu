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
| `verification_status` | PENDING, VERIFIED, REJECTED |
| `report_reason` | SPOILED, MISLABELED, NO_SHOW, INAPPROPRIATE, OTHER |
| `report_status` | OPEN, REVIEWING, RESOLVED, DISMISSED |
| `sms_purpose` | OTP, NEW_LISTING_ALERT, CLAIM_ACCEPTED, PICKUP_REMINDER, GENERIC |
| `sms_status` | QUEUED, SENT, DELIVERED, FAILED |

### Custom auth fields (managed by Better Auth)

- **`user.role`** (text, default `RESTAURANT`, `input: false` so clients can't self-elevate). Allowed values mirror `user_role` enum.
- **`organization`** extended fields: `type` (default `RESTAURANT`), `cityId`, `phone`, `address`, `latitude`, `longitude`, `verificationStatus` (default `PENDING`), `verifiedAt`.

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

Each dashboard route adds its own `beforeLoad` calling the matching `canX(user)` helper from `src/lib/permissions.ts` and redirecting to `roleToDashboard(user.role)` on mismatch:

| Route | Allowed roles |
|-------|---------------|
| `/admin/dashboard` | `canAccessAdmin` → ADMIN only |
| `/restaurant/dashboard` | `canCreateFoodListing` → RESTAURANT, ADMIN |
| `/ngo/dashboard` | `canClaimHumanFood` → NGO, ADMIN |
| `/animal/dashboard` | `canClaimAnimalFood` → ANIMAL_RESCUE, ADMIN |

After `signIn.email`, the login page navigates to `roleToDashboard(user.role)`. Same after `signUp.email` (auto-sign-in is enabled).

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
