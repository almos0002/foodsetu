import { betterAuth } from 'better-auth'
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
    ? replitProdDomains?.map((d) => `https://${d}`) ?? []
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
        defaultValue: 'donor',
        input: false,
      },
    },
  },
  plugins: [organization()],
})

export type Session = typeof auth.$Infer.Session
