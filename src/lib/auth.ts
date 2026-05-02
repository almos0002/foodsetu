import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { organization } from 'better-auth/plugins/organization'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const isProduction = process.env.NODE_ENV === 'production'
const replitDevDomain = process.env.REPLIT_DEV_DOMAIN
const replitProdDomains = process.env.REPLIT_DOMAINS?.split(',')
  .map((d) => d.trim())
  .filter(Boolean)

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (isProduction && replitProdDomains && replitProdDomains.length > 0
    ? `https://${replitProdDomains[0]}`
    : replitDevDomain
      ? `https://${replitDevDomain}`
      : undefined)

const trustedOrigins = [
  ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ...(isProduction
    ? (replitProdDomains?.map((d) => `https://${d}`) ?? [])
    : replitDevDomain
      ? [`https://${replitDevDomain}`]
      : []),
]

export const auth = betterAuth({
  appName: 'FoodSetu',
  baseURL,
  trustedOrigins,
  database: pool,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'RESTAURANT',
        input: true,
      },
    },
  },
  // Defense in depth: also enforced in the request-level hooks below.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const ALLOWED = ['RESTAURANT', 'NGO', 'ANIMAL_RESCUE'] as const
          const requested = (user as { role?: string }).role
          const safeRole = (ALLOWED as readonly string[]).includes(
            requested ?? '',
          )
            ? requested
            : 'RESTAURANT'
          return { data: { ...user, role: safeRole } }
        },
      },
    },
  },
  // Request-level guards — fire BEFORE Better Auth applies additionalFields,
  // so they reliably block role tampering on update-user (which databaseHooks
  // does not catch for additionalFields like `role`).
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const path = ctx.path
      // Sanitize role on signup. ADMIN may never be self-assigned.
      if (path.startsWith('/sign-up/email')) {
        const ALLOWED = ['RESTAURANT', 'NGO', 'ANIMAL_RESCUE']
        const body = ctx.body as Record<string, unknown> | undefined
        if (body) {
          const requested =
            typeof body.role === 'string' ? body.role : undefined
          if (!requested || !ALLOWED.includes(requested)) {
            body.role = 'RESTAURANT'
          }
        }
      }
      // Strip role from any user update — role is server-managed only.
      if (path.startsWith('/update-user')) {
        const body = ctx.body as Record<string, unknown> | undefined
        if (body && 'role' in body) {
          delete body.role
        }
      }
      // Defense in depth: app code creates orgs via our server fn
      // (org-server.ts) which enforces role/type matching, single-org,
      // and PENDING verification. Block Better Auth's direct
      // /organization/create endpoint so attackers can't bypass those rules
      // (e.g. forge the type, create multiple orgs, set verificationStatus).
      if (path.startsWith('/organization/create')) {
        throw new Error(
          'Organization creation must go through the onboarding flow',
        )
      }
      // Block direct updates to organization profile fields too — verification
      // status is admin-managed via our server fn.
      if (path.startsWith('/organization/update')) {
        const body = ctx.body as Record<string, unknown> | undefined
        if (body) {
          if ('verificationStatus' in body) delete body.verificationStatus
          if ('verifiedAt' in body) delete body.verifiedAt
          if ('type' in body) delete body.type
        }
      }
    }),
  },
  plugins: [
    organization({
      schema: {
        organization: {
          additionalFields: {
            type: {
              type: 'string',
              required: false,
              defaultValue: 'RESTAURANT',
            },
            cityId: { type: 'string', required: false },
            phone: { type: 'string', required: false },
            address: { type: 'string', required: false },
            description: { type: 'string', required: false },
            latitude: { type: 'number', required: false },
            longitude: { type: 'number', required: false },
            verificationStatus: {
              type: 'string',
              required: false,
              defaultValue: 'PENDING',
            },
            verifiedAt: { type: 'date', required: false },
          },
        },
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
