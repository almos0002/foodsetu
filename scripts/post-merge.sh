#!/bin/bash
set -e

# Install/refresh dependencies (idempotent, no audit/fund noise).
npm install --no-audit --no-fund

if [ -n "$DATABASE_URL" ]; then
  # Apply Drizzle SQL migrations from /drizzle. This is additive —
  # it only runs new migration files and NEVER drops tables that
  # aren't in src/db/schema.ts (such as the Better Auth tables).
  # Tasks that change the schema must include a new migration file.
  npx --yes drizzle-kit migrate

  # Sync Better Auth managed tables (user, session, account,
  # organization, member, invitation, verification). Idempotent.
  npx --yes @better-auth/cli@latest migrate -y
else
  echo "post-merge: DATABASE_URL not set, skipping db migrations"
fi
