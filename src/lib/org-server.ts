import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { randomUUID } from 'node:crypto'
import { auth, pool } from './auth'
import { isValidRole } from './permissions'

export type OrganizationRow = {
  id: string
  name: string
  slug: string
  type: string | null
  description: string | null
  phone: string | null
  address: string | null
  cityId: string | null
  latitude: number | null
  longitude: number | null
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  verifiedAt: string | null
  createdAt: string
}

export type OrganizationWithOwner = OrganizationRow & {
  ownerId: string | null
  ownerName: string | null
  ownerEmail: string | null
  ownerRole: string | null
}

const ORG_TYPE_FOR_ROLE: Record<string, string> = {
  RESTAURANT: 'RESTAURANT',
  NGO: 'NGO',
  ANIMAL_RESCUE: 'ANIMAL_RESCUE',
}

export function expectedOrgTypeForRole(role: string | null | undefined): string | null {
  return role ? ORG_TYPE_FOR_ROLE[role] ?? null : null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'org'
}

async function requireUser() {
  const request = getRequest()
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) throw new Error('UNAUTHORIZED')
  return session.user as typeof session.user & { role?: string | null }
}

async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'ADMIN') throw new Error('FORBIDDEN')
  return user
}

async function fetchOrgForUser(userId: string): Promise<OrganizationRow | null> {
  // Scoped to owner role: the entire app currently models a user as owning at
  // most one org (enforced by the `member_one_owner_per_user_uq` partial
  // unique index). Filtering on `m.role = 'owner'` keeps the route context's
  // organization aligned with what the server-side `requireVerified*Org`
  // gates accept, so UI gates never disagree with mutation gates if a future
  // invitation flow adds non-owner memberships.
  const { rows } = await pool.query(
    `SELECT o.* FROM "organization" o
       JOIN "member" m ON m."organizationId" = o.id
      WHERE m."userId" = $1 AND m.role = 'owner'
      ORDER BY o."createdAt" ASC
      LIMIT 1`,
    [userId],
  )
  return (rows[0] as OrganizationRow | undefined) ?? null
}

export const getMyOrganizationFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) return null
    return fetchOrgForUser(session.user.id)
  },
)

type CreateOrgInput = {
  name: string
  description?: string
  phone?: string
  address?: string
  cityId?: string | null
  latitude?: number | null
  longitude?: number | null
}

function validateCreateInput(value: unknown): CreateOrgInput {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  const name = typeof v.name === 'string' ? v.name.trim() : ''
  if (name.length < 2 || name.length > 120) {
    throw new Error('Name must be between 2 and 120 characters')
  }
  const optStr = (k: string, max: number) => {
    const x = v[k]
    if (x === undefined || x === null || x === '') return undefined
    if (typeof x !== 'string') throw new Error(`${k} must be a string`)
    if (x.length > max) throw new Error(`${k} too long`)
    return x.trim()
  }
  const optNum = (k: string) => {
    const x = v[k]
    if (x === undefined || x === null || x === '') return null
    const n = typeof x === 'number' ? x : Number(x)
    if (!Number.isFinite(n)) throw new Error(`${k} must be a number`)
    return n
  }
  const lat = optNum('latitude')
  const lng = optNum('longitude')
  if (lat !== null && (lat < -90 || lat > 90)) throw new Error('Latitude out of range')
  if (lng !== null && (lng < -180 || lng > 180)) throw new Error('Longitude out of range')
  return {
    name,
    description: optStr('description', 1000),
    phone: optStr('phone', 30),
    address: optStr('address', 300),
    cityId: optStr('cityId', 64) ?? null,
    latitude: lat,
    longitude: lng,
  }
}

export const createMyOrganizationFn = createServerFn({ method: 'POST' })
  .inputValidator(validateCreateInput)
  .handler(async ({ data }) => {
    const user = await requireUser()
    if (user.role === 'ADMIN') {
      throw new Error('Admins do not create organizations')
    }
    if (!isValidRole(user.role) || !user.role) {
      throw new Error('Invalid user role')
    }
    const expectedType = expectedOrgTypeForRole(user.role)
    if (!expectedType) throw new Error('Your role cannot create an organization')

    // Reject if user already has an org
    const existing = await fetchOrgForUser(user.id)
    if (existing) throw new Error('You already have an organization')

    // Validate cityId references an actual city if provided
    if (data.cityId) {
      const c = await pool.query('SELECT id FROM cities WHERE id = $1', [data.cityId])
      if (c.rowCount === 0) throw new Error('Invalid city selected')
    }

    const orgId = randomUUID()
    const slugBase = slugify(data.name)
    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `INSERT INTO "organization"
          (id, name, slug, type, description, phone, address, "cityId",
           latitude, longitude, "verificationStatus", "verifiedAt", "createdAt", metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING',NULL,NOW(),NULL)`,
        [
          orgId,
          data.name,
          slug,
          expectedType,
          data.description ?? null,
          data.phone ?? null,
          data.address ?? null,
          data.cityId ?? null,
          data.latitude,
          data.longitude,
        ],
      )
      // The unique partial index `member_one_owner_per_user_uq` (on
      // member."userId" WHERE role='owner') makes this INSERT the
      // race-condition guard: the second concurrent submission gets a
      // 23505 (unique_violation) here and we ROLLBACK, leaving only one
      // org+owner pair per user.
      await client.query(
        `INSERT INTO "member" (id, "organizationId", "userId", role, "createdAt")
         VALUES ($1, $2, $3, 'owner', NOW())`,
        [randomUUID(), orgId, user.id],
      )
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      // Unique violation on member ownership = a concurrent submission won.
      if (
        e &&
        typeof e === 'object' &&
        (e as { code?: string }).code === '23505'
      ) {
        throw new Error('You already have an organization')
      }
      throw e
    } finally {
      client.release()
    }

    return fetchOrgForUser(user.id)
  })

export const listOrganizationsForAdminFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()
    const { rows } = await pool.query(
      `SELECT o.*,
              owner.id   AS "ownerId",
              owner.name AS "ownerName",
              owner.email AS "ownerEmail",
              owner.role AS "ownerRole"
         FROM "organization" o
         LEFT JOIN LATERAL (
           SELECT u.id, u.name, u.email, u.role
             FROM "member" m
             JOIN "user" u ON u.id = m."userId"
            WHERE m."organizationId" = o.id
            ORDER BY m."createdAt" ASC
            LIMIT 1
         ) owner ON TRUE
        ORDER BY o."createdAt" DESC`,
    )
    return rows as OrganizationWithOwner[]
  },
)

const ALLOWED_ADMIN_STATUSES = new Set([
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
])

function validateSetStatusInput(value: unknown): {
  organizationId: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
} {
  if (!value || typeof value !== 'object') throw new Error('Invalid input')
  const v = value as Record<string, unknown>
  if (typeof v.organizationId !== 'string' || !v.organizationId) {
    throw new Error('organizationId required')
  }
  if (typeof v.status !== 'string' || !ALLOWED_ADMIN_STATUSES.has(v.status)) {
    throw new Error('Invalid status')
  }
  return {
    organizationId: v.organizationId,
    status: v.status as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
  }
}

export const setOrganizationVerificationFn = createServerFn({ method: 'POST' })
  .inputValidator(validateSetStatusInput)
  .handler(async ({ data }) => {
    await requireAdmin()
    const verifiedAt = data.status === 'VERIFIED' ? 'NOW()' : 'NULL'
    const result = await pool.query(
      `UPDATE "organization"
          SET "verificationStatus" = $1,
              "verifiedAt" = ${verifiedAt}
        WHERE id = $2
        RETURNING *`,
      [data.status, data.organizationId],
    )
    if (result.rowCount === 0) throw new Error('Organization not found')
    return result.rows[0] as OrganizationRow
  })

export const listCitiesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { rows } = await pool.query(
    `SELECT id, name, state FROM cities WHERE is_active = true ORDER BY name ASC`,
  )
  return rows as { id: string; name: string; state: string | null }[]
})
