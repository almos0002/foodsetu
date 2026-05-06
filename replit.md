# FoodSetu

Connects restaurants/hotels/bakeries with surplus food to verified NGOs, shelters, and animal rescue groups.

## Run & Operate

```bash
npm install
npm run dev        # Starts dev server on port 5000
npm run build      # Production build (output to .output/)
npm run test       # Run vitest tests
npm run lint       # ESLint
npx @better-auth/cli@latest migrate -y # For auth schema changes
npx drizzle-kit generate --name <change_description> # For domain schema changes
```

**Required Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (auto-set by Replit)
- `BETTER_AUTH_SECRET`: 32+ character secret for cookie signing

## Stack

- **Framework**: TanStack Start (React, Vite, Nitro SSR)
- **Styling**: Tailwind CSS v4
- **Icons**: `lucide-react`
- **Database**: PostgreSQL (Replit-managed)
- **ORM**: Drizzle ORM
- **Auth**: Better Auth (email/password, organization plugin)
- **Language**: TypeScript
- **Package Manager**: npm

## Where things live

- `src/lib/auth.ts`: Better Auth server config
- `src/db/schema.ts`: Drizzle schema (domain tables)
- `drizzle/`: Drizzle migrations
- `src/routes/`: File-based routing
- `src/routes/__root.tsx`: Root layout
- `src/styles.css`: Global Tailwind styles
- `src/lib/permissions.ts`: Enum mappings, status sets, and UI constants
- `WORKFLOW.md`: End-to-end product flow

## Architecture decisions

- **Dual Migration Systems**: Better Auth manages its tables (`user`, `session`, `organization`, etc.) independently from Drizzle-managed domain tables, referencing each other via soft text references without FK constraints to avoid conflicts.
- **Role-based Access**: Public routes, protected routes (`_authed.tsx`), and granular in-page action gates ensure proper authorization based on user role and organization verification status.
- **Org Onboarding & Verification**: Non-admin users must complete organization onboarding and pass verification before accessing core functionalities, enforced by redirects and `canX` helper functions.
- **Atomic Claim Management**: Claim creation, acceptance, rejection, and pickup verification are handled via Drizzle transactions with race guards, status checks, and OTPs to ensure data integrity and prevent concurrency issues.
- **OTP Handoff Model**: OTPs are generated on claim acceptance but are only visible to the claimant, while the restaurant verifies the code, ensuring secure and private food handoff.
- **Listing Expiry Sweep**: An expiry sweep runs opportunistically on hot-path data fetches to keep listing statuses current without requiring a dedicated cron job.
- **Session Cookie Cache**: Better Auth `session.cookieCache` (60s TTL) avoids hitting the DB on every `getSession()` call. Combined with router preload (`defaultPreloadStaleTime: 30s`), this materially reduces nav latency.
- **Card Image Sizing**: All listing cards use fixed `h-48 object-cover` for visual consistency. The hero panel uses an explicit pixel height (`h-[520px]`) rather than `aspect-*` because absolute-positioned `h-full` images don't reliably resolve against an `aspect-ratio`-derived container height.

## Product

- **Food Listing**: Restaurants can create, edit, and cancel food listings, which are then categorized and made available for claim.
- **Food Claiming**: NGOs and Animal Rescues can browse nearby available food listings (human-safe or animal-safe respectively) and create claims.
- **Claim Management**: Restaurants can accept or reject incoming claims and verify food pickup using a one-time password (OTP).
- **Admin Dashboard**: Administrators have comprehensive oversight, including user/organization management, listing/claim review, report triaging, and city management.
- **Reporting System**: Any logged-in user can report issues against listings or claims, with admins managing the resolution workflow.

## User preferences

_Populate as you build_

## Gotchas

- **Database Migrations**: Remember to run `@better-auth/cli migrate` for auth schema changes and `drizzle-kit generate` for domain schema changes. Drizzle migrations typically require manual application via `psql` in Replit.
- **OTP Input**: OTP input fields strip non-digit characters both client- and server-side.
- **Admin Promotion**: User roles cannot be elevated to `ADMIN` via self-signup; this must be done manually via SQL.
- **Session Origin Header**: For `signOut()` to work correctly outside a browser, include `-H "Origin: https://$REPLIT_DEV_DOMAIN"` in `curl` requests.

## Pointers

- **TanStack Start Docs**: [https://tanstack.com/start/latest](https://tanstack.com/start/latest)
- **Better Auth Docs**: [https://betterauth.dev/docs](https://betterauth.dev/docs)
- **Drizzle ORM Docs**: [https://orm.drizzle.team/docs/overview](https://orm.drizzle.team/docs/overview)
- **Tailwind CSS Docs**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Project Workflow**: [./WORKFLOW.md](./WORKFLOW.md)