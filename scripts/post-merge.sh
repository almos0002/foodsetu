#!/bin/bash
set -e

# Install/refresh dependencies (idempotent, no audit/fund noise).
# This installs the pinned @better-auth/cli devDependency too, so the
# CLI invocation below uses a known, reviewed version (NOT @latest).
npm install --no-audit --no-fund

if [ -n "$DATABASE_URL" ]; then
  # 1. Apply Drizzle SQL migrations from /drizzle. Additive only —
  # only runs new migration files and NEVER drops tables that
  # aren't in src/db/schema.ts (such as the Better Auth tables).
  # Tasks that change the schema must add a new migration file.
  npx --no-install drizzle-kit migrate

  # 2. Sync Better Auth managed tables (user, session, account,
  # organization, member, invitation, verification). Idempotent.
  # Pinned to the version installed as a devDependency above.
  npx --no-install @better-auth/cli migrate -y

  # 3. Patch Better Auth column types that don't fit our domain.
  # Better Auth maps `type: 'number'` to integer, but our org
  # latitude/longitude need decimal precision. Idempotent: only
  # alters when current type is integer. Runs after step 2 so
  # the columns exist.
  psql "$DATABASE_URL" <<'SQL'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization'
      AND column_name = 'latitude'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE "organization"
      ALTER COLUMN latitude TYPE numeric(10,7) USING latitude::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization'
      AND column_name = 'longitude'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE "organization"
      ALTER COLUMN longitude TYPE numeric(10,7) USING longitude::numeric;
  END IF;
END $$;
SQL
else
  echo "post-merge: DATABASE_URL not set, skipping db migrations"
fi
