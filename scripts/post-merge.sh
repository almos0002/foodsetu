#!/bin/bash
set -e

# Install/refresh dependencies (idempotent, no audit/fund noise).
npm install --no-audit --no-fund

# Sync the database schema with src/db/schema.ts.
# Uses drizzle-kit push (non-interactive via --force) so any new
# columns/tables added in a merged task are applied automatically.
if [ -n "$DATABASE_URL" ]; then
  npx --yes drizzle-kit push --force
else
  echo "post-merge: DATABASE_URL not set, skipping drizzle push"
fi
