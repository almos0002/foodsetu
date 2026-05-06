# FoodSetu

FoodSetu connects organizations with surplus food to NGOs and shelters, facilitating food donation and rescue.

## Run & Operate

```bash
npm install
npm run dev        # Starts dev server on port 5000
npm run build      # Production build (output to .output/)
npm run test       # Run vitest tests
npm run lint       # ESLint
```

**Database Migrations:**

- Better Auth tables (`user`, `session`, `organization`, etc.):
  ```bash
  npx @better-auth/cli@latest migrate -y
  ```
- Drizzle domain tables (`cities`, `food_listings`, `claims`, etc.):
  ```bash
  npx drizzle-kit generate --name <change_description>
  # Then manually apply the generated SQL file (drizzle/<NNNN>_<name>.sql) via Replit's SQL tool or:
  # psql "$DATABASE_URL" -f drizzle/<NNNN>_<name>.sql
  ```

**Required Environment Variables:**

- `DATABASE_URL`: PostgreSQL connection string (auto-set by Replit).
- `BETTER_AUTH_SECRET`: 32+ character secret for cookie signing.
- `BETTER_AUTH_URL`: (Optional) Base URL override; inferred from `REPLIT_DEV_DOMAIN` / `REPLIT_DOMAINS` if not set.

## Stack

- **Framework**: TanStack Start (React, Vite, Nitro SSR)
- **Router**: TanStack Router (file-based)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Replit-managed)
- **ORM**: Drizzle ORM
- **Auth**: Better Auth (email/password, organization plugin)
- **Language**: TypeScript
- **Package Manager**: npm

## Where things live

- `src/lib/auth.ts`: Better Auth server configuration and hooks.
- `src/db/schema.ts`: Drizzle ORM database schema (domain tables).
- `src/routes/`: File-based routing definitions.
- `src/styles.css`: Global Tailwind CSS imports.
- `drizzle/`: Drizzle-kit generated SQL migrations.
- `drizzle.config.ts`: Drizzle-kit configuration.
- `public/`: Static assets.
- `src/lib/listing-server.ts`: Server functions for food listings.
- `src/lib/claim-server.ts`: Server functions for claims (NGO/Animal Rescue).
- `src/lib/admin-server.ts`: Server functions for admin operations.
- `src/lib/report-server.ts`: Server functions for reporting.
- `src/lib/org-server.ts`: Server functions for organization management.
- `src/lib/expiry-server.ts`: Logic for expiring old listings.
- `src/lib/permissions.ts`: Defines enums, roles, and status constants.
- `src/components/hero/IsometricHandoff.tsx`: Three.js / r3f animated globe in the hero (low-poly sphere, glowing donor/receiver city dots across Nepal, animated bezier arcs with traveling pulses). Client-only via `mounted` flag; respects `prefers-reduced-motion`.

## Architecture decisions

- **Dual Migration Systems**: Better Auth manages its tables, while Drizzle-kit handles domain tables. This minimizes conflicts and leverages specialized tools.
- **Soft References for Auth/Domain Data**: Domain tables reference `user.id` and `organization.id` without foreign key constraints, using application-level integrity checks to allow independent evolution of auth and business logic schemas.
- **Race Guard for Org Creation**: A unique partial index on `member` table (`member_one_owner_per_user_uq`) prevents a user from creating multiple organizations concurrently.
- **OTP Handoff Model**: OTPs are generated on claim acceptance and visible to the claimant, but not directly to the donor. The donor enters the code for verification, preventing potential misuse or leakage.
- **Listing Expiry Sweep**: Instead of a dedicated cron job, listing expiry is piggy-backed onto hot-path data fetches, ensuring timely updates in the UI without additional infrastructure.

## Product

- **Food Donation Platform**: Connects restaurants/hotels/bakeries with surplus food to NGOs, shelters, and animal rescue groups.
- **Role-Based Access**: Differentiates user experiences for Admins, Restaurants, NGOs, and Animal Rescues with specific dashboards and functionalities.
- **Organization Onboarding & Verification**: Non-admin users must create and have their organization verified before performing key actions (e.g., creating listings, claiming food).
- **Listing Management**: Restaurants can create, update, cancel, and view their food listings, managing claims from NGOs/Animal Rescues.
- **Claim Management**: NGOs and Animal Rescues can browse nearby available food, create claims, and track their claim status.
- **Reporting System**: Users can report issues related to listings, claims, or organizations, which are then triaged by administrators.
- **Admin Tools**: Comprehensive dashboards for managing users, organizations, listings, claims, reports, and cities.

## User preferences

_Populate as you build_

## Gotchas

- **Database Migrations**: Remember to run both Better Auth CLI and Drizzle-kit migrations separately after schema changes. Drizzle migrations require manual application of the generated SQL.
- **Role Coercion**: User roles are strictly managed; self-signup for `ADMIN` role is prevented, and roles are coerced to `RESTAURANT` if invalid during registration.
- **`Origin` Header for Sign-out**: Better Auth sign-out requires a matching `Origin` header; essential for `curl` testing (`-H "Origin: https://$REPLIT_DEV_DOMAIN"`).
- **OTP Verification**: The server-side OTP verification strips non-digit characters; ensure client-side input also handles this gracefully.

## Pointers

- **[WORKFLOW.md](./WORKFLOW.md)**: Full end-to-end product workflow.
- **TanStack Start Documentation**: [https://tanstack.com/start/latest](https://tanstack.com/start/latest)
- **TanStack Router Documentation**: [https://tanstack.com/router/latest](https://tanstack.com/router/latest)
- **Better Auth Documentation**: [https://better-auth.dev/docs](https://better-auth.dev/docs)
- **Drizzle ORM Documentation**: [https://orm.drizzle.team/docs/overview](https://orm.drizzle.team/docs/overview)
- **Tailwind CSS Documentation**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)