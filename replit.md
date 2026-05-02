# FoodSetu - TanStack Start App

## Overview
FoodSetu is a web application built with TanStack Start (React + Vite + Nitro SSR) that connects restaurants, hotels, and bakeries with surplus food to verified NGOs, shelters, and animal rescue groups. Its core purpose is to facilitate the efficient redistribution of food, reducing waste and addressing food insecurity. The project aims to establish a seamless, reliable platform for food donation and recovery, with a focus on a minimal, monochrome design aesthetic.

## User Preferences
- **Hard "do not" list (enforced across every page):**
  - ❌ no rotated stickers, chips, or cards (`-rotate-3`/`-rotate-6` were swept out of the codebase)
  - ❌ no oversized rounded-`[28px]`/`[32px]` radii — use `rounded-lg`/`rounded-xl`/`rounded-2xl`
  - ❌ no `border-[1.5px]` or other off-spec border widths
  - ❌ no dotgrid backgrounds on dashboards
  - ❌ no editorial/magazine devices (Roman numerals, paper grain, oversized italics, dotted column rules)
  - ❌ no cartoon mascots, blob shapes, squiggles, or rainbow palettes
  - ❌ no soft glows or large drop shadows; only `shadow-sm` on small floating chips is allowed
  - ❌ no hover-lift transforms (`hover:-translate-y-0.5`)
  - ✅ one accent color only (`--color-accent`); everything else is ink + line + bg
  - ✅ `rounded-full` for pills/dots, `rounded-xl`/`rounded-2xl` for cards, `rounded-md`/`rounded-lg` for inputs/buttons/nav items
  - ✅ all photos use Unsplash with `w=800–1600&auto=format&fit=crop&q=80`
  - ✅ footer year on `/` is a **static literal** (not `new Date().getFullYear()`) to avoid SSR/timezone drift

## System Architecture

The application uses TanStack Start as its framework, leveraging Vite and Nitro for SSR. File-based routing is handled by TanStack Router. Styling is managed with Tailwind CSS v4, configured with a CSS-first approach. Icons are sourced from `lucide-react`.

### UI / Design System
The UI adheres to a minimal product-site aesthetic, characterized by quiet monochrome surfaces and a single deep emerald accent (`--color-accent: #0a7a3f`). Hierarchy is established through typography, hairline borders, and generous whitespace, avoiding shadows or color floods.

**Canonical Tokens (entire site):**
- **Accent**: `--color-accent: #0a7a3f` (deep emerald).
- **Ink scale**: `--color-ink` (`#0a0a0a`) to `--color-ink-4` (`#b8b8b3`).
- **Surfaces**: `--color-bg` (white), `--color-bg-2`/`--color-bg-3` (off-white).
- **Lines**: `--color-line`, `--color-line-2`, `--color-line-strong`.
- **Numbers**: Always `tabular-nums` via the `numeric` utility.
- **Eyebrow labels**: `text-[11px] font-semibold uppercase tracking-wider`.
- **Display headings**: `font-display text-2xl font-semibold`.

**Dashboard Shell:** Features a fixed `248px` sidebar on desktop and a mobile drawer. Navigation is role-driven (RESTAURANT / NGO / ANIMAL / ADMIN) with active items using a role-toned soft background and ink text. Content has a max-width of `1200px`.

### Technical Implementations
- **Routing:** File-based routing in `src/routes/` with `TanStack Router`.
- **Server-Side Rendering (SSR):** Implemented with `TanStack Start` and `Nitro`.
- **Hydration Hygiene:** Custom `stubServerOnlyForClient()` Vite plugin prevents server-only modules from being bundled into the client. `Buffer` polyfill and `Intl.DateTimeFormat` with fixed `timeZone: 'Asia/Kathmandu'` are used to prevent hydration mismatches.
- **Geo-matching:** `haversineKm` function and `getNearbyListings` for efficient location-based food discovery, with a bounding-box pre-filter in SQL and exact Haversine calculation in app code.
- **Listing Expiry Sweep:** Piggy-backed onto hot-path data fetches, `safeExpireOldListings()` atomically updates expired listings and cancels associated claims.

### Feature Specifications
- **Role-Based Access:** Public routes, protected routes under `_authed.tsx`, with `beforeLoad` checks for user roles and redirection.
- **Organization Onboarding & Verification:** Non-admin users must create and verify an organization profile. Four verification states: `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED`, each dictating available actions.
- **Restaurant Food Listings:** CRUD operations for food listings, with verification gates and status-based editability/cancelability.
- **Claimant Flows (NGO + Animal Rescue):** Identical UI and atomic transaction logic for claiming food, differentiated by organization type and food category (`HUMAN_SAFE`, `ANIMAL_SAFE`). Includes nearby food discovery and claim management.
- **Restaurant-side Claim Management:** Accept/Reject claims, generate and verify OTP for pickup. OTP is visible to the receiver but not the donor.
- **Admin Dashboard:** Comprehensive overview of users, organizations, listings, claims, and reports, with management capabilities including verification and cancellation.
- **Reporting System:** Allows any logged-in user to flag issues with listings, claims, or organizations. Admins triage reports.
- **Notifications (SMS/WhatsApp Placeholder):** A placeholder service logs notification attempts to `sms_logs` table, ready for integration with real providers.

### Database & Auth
- **Better Auth:** Manages `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation` tables.
- **Drizzle ORM:** Manages `cities`, `food_listings`, `claims`, `reports`, `sms_logs` tables.
- **Enums:** Postgres enums are used for `user_role`, `org_type`, `food_category`, `food_listing_status`, `claim_status`, `verification_status`, `report_reason`, `report_status`, `sms_purpose`, `sms_status`.
- **Custom Auth Fields:** `user.role`, extended `organization` fields (`type`, `cityId`, `phone`, `address`, `description`, `latitude`, `longitude`, `verificationStatus`, `verifiedAt`).
- **Migrations:** Better Auth CLI for auth tables, Drizzle Kit for domain tables.
- **Single-org-per-user Invariant:** A unique partial index (`member_one_owner_per_user_uq`) prevents users from creating multiple organizations.
- **Defense-in-depth at Auth Layer:** Server-side middleware enforces integrity of server-managed fields.

## External Dependencies

- **Database:** Replit-managed PostgreSQL (accessed via `DATABASE_URL` and `PG*` environment variables).
- **Authentication:** Better Auth with email/password and organization plugin.
- **Icons:** `lucide-react`.
- **Fonts:** Inter (for display and body), JetBrains Mono (for mono), Instrument Serif (for editorial), Poppins (for legacy pages), loaded from Google Fonts.
- **Image Hosting:** Unsplash (for all photos with specific query parameters).
- **SMS/WhatsApp Provider:** Placeholder (`src/lib/notification-server.ts`) for future integration with services like Twilio, Vonage, or MSG91.