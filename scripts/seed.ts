/**
 * Deterministic, idempotent QA seed for FoodSetu.
 *
 * Provisions:
 *   - 1 admin (admin@foodsetu.dev)            role=ADMIN, no org
 *   - 3 PENDING orgs   (restaurant / NGO / animal-rescue)
 *   - 3 VERIFIED orgs  (restaurant / NGO / animal-rescue)
 *   - 4 sample listings owned by the verified restaurant:
 *       * "Veg biryani lunch surplus"      HUMAN_SAFE,  AVAILABLE, future pickup
 *       * "Bakery loaves end-of-day"       HUMAN_SAFE,  AVAILABLE, future pickup
 *       * "Curd rice scraps for strays"    ANIMAL_SAFE, AVAILABLE, future pickup
 *       * "Stale pakoras (past pickup)"    HUMAN_SAFE,  AVAILABLE, expired
 *
 * Run:
 *   npx tsx scripts/seed.ts
 *
 * Idempotent: re-running deletes the seeded users (cascading sessions,
 * accounts, members) and the verified-restaurant's seeded listings, then
 * re-creates them. Cities are upserted (preserves IDs).
 *
 * Password for every seeded user: `password123`
 */

import { Pool } from 'pg'
import { auth } from '../src/lib/auth'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run scripts/seed.ts')
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const PASSWORD = 'password123'

type SeedUser = {
  email: string
  name: string
  role: 'ADMIN' | 'RESTAURANT' | 'NGO' | 'ANIMAL_RESCUE'
}

type SeedOrg = {
  ownerEmail: string
  name: string
  type: 'RESTAURANT' | 'NGO' | 'ANIMAL_RESCUE'
  status: 'PENDING' | 'VERIFIED'
  cityId: string
  latitude: number
  longitude: number
  phone: string
  address: string
}

const USERS: SeedUser[] = [
  { email: 'admin@foodsetu.dev', name: 'FoodSetu Admin', role: 'ADMIN' },
  {
    email: 'pending-restaurant@foodsetu.dev',
    name: 'Pending Diner',
    role: 'RESTAURANT',
  },
  {
    email: 'verified-restaurant@foodsetu.dev',
    name: 'Verified Diner',
    role: 'RESTAURANT',
  },
  { email: 'pending-ngo@foodsetu.dev', name: 'Pending NGO', role: 'NGO' },
  { email: 'verified-ngo@foodsetu.dev', name: 'Verified NGO', role: 'NGO' },
  {
    email: 'pending-animal@foodsetu.dev',
    name: 'Pending Rescue',
    role: 'ANIMAL_RESCUE',
  },
  {
    email: 'verified-animal@foodsetu.dev',
    name: 'Verified Rescue',
    role: 'ANIMAL_RESCUE',
  },
]

const ORGS: SeedOrg[] = [
  {
    ownerEmail: 'pending-restaurant@foodsetu.dev',
    name: 'Pending Diner Co.',
    type: 'RESTAURANT',
    status: 'PENDING',
    cityId: 'city_blr',
    latitude: 12.9716,
    longitude: 77.5946,
    phone: '+91 90000 00001',
    address: '12 Test Lane, Bengaluru',
  },
  {
    ownerEmail: 'verified-restaurant@foodsetu.dev',
    name: 'Verified Diner Co.',
    type: 'RESTAURANT',
    status: 'VERIFIED',
    cityId: 'city_blr',
    latitude: 12.9716,
    longitude: 77.5946,
    phone: '+91 90000 00002',
    address: '34 Sample Road, Bengaluru',
  },
  {
    ownerEmail: 'pending-ngo@foodsetu.dev',
    name: 'Pending Helping Hands',
    type: 'NGO',
    status: 'PENDING',
    cityId: 'city_blr',
    latitude: 12.9352,
    longitude: 77.6245,
    phone: '+91 90000 00003',
    address: '7 Hope Street, Bengaluru',
  },
  {
    ownerEmail: 'verified-ngo@foodsetu.dev',
    name: 'Verified Helping Hands',
    type: 'NGO',
    status: 'VERIFIED',
    cityId: 'city_blr',
    latitude: 12.9352,
    longitude: 77.6245,
    phone: '+91 90000 00004',
    address: '9 Hope Street, Bengaluru',
  },
  {
    ownerEmail: 'pending-animal@foodsetu.dev',
    name: 'Pending Strays Trust',
    type: 'ANIMAL_RESCUE',
    status: 'PENDING',
    cityId: 'city_blr',
    latitude: 12.9784,
    longitude: 77.6408,
    phone: '+91 90000 00005',
    address: '4 Paw Lane, Bengaluru',
  },
  {
    ownerEmail: 'verified-animal@foodsetu.dev',
    name: 'Verified Strays Trust',
    type: 'ANIMAL_RESCUE',
    status: 'VERIFIED',
    cityId: 'city_blr',
    latitude: 12.9784,
    longitude: 77.6408,
    phone: '+91 90000 00006',
    address: '6 Paw Lane, Bengaluru',
  },
]

const SEED_LISTING_TITLES = [
  'Veg biryani lunch surplus',
  'Bakery loaves end-of-day',
  'Curd rice scraps for strays',
  'Stale pakoras (past pickup)',
]

async function ensureCities(): Promise<void> {
  const cities = [
    {
      id: 'city_blr',
      name: 'Bengaluru',
      state: 'Karnataka',
      slug: 'bengaluru',
      lat: 12.9716,
      lng: 77.5946,
    },
    {
      id: 'city_mum',
      name: 'Mumbai',
      state: 'Maharashtra',
      slug: 'mumbai',
      lat: 19.076,
      lng: 72.8777,
    },
    {
      id: 'city_del',
      name: 'Delhi',
      state: 'Delhi',
      slug: 'delhi',
      lat: 28.6139,
      lng: 77.209,
    },
    {
      id: 'city_chn',
      name: 'Chennai',
      state: 'Tamil Nadu',
      slug: 'chennai',
      lat: 13.0827,
      lng: 80.2707,
    },
    {
      id: 'city_hyd',
      name: 'Hyderabad',
      state: 'Telangana',
      slug: 'hyderabad',
      lat: 17.385,
      lng: 78.4867,
    },
  ]
  for (const c of cities) {
    await pool.query(
      `INSERT INTO cities (id, name, state, country, slug, latitude, longitude, is_active)
       VALUES ($1,$2,$3,'IN',$4,$5,$6,true)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         state = EXCLUDED.state,
         slug = EXCLUDED.slug,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         is_active = true`,
      [c.id, c.name, c.state, c.slug, c.lat, c.lng],
    )
  }
}

async function dropSeedData(): Promise<void> {
  const emails = USERS.map((u) => u.email)
  // Resolve user IDs
  const { rows: userRows } = await pool.query(
    `SELECT id FROM "user" WHERE email = ANY($1::text[])`,
    [emails],
  )
  const userIds = userRows.map((r: { id: string }) => r.id)
  if (userIds.length === 0) return

  // Drop owned orgs (cascades members via FK in better-auth schema is NOT
  // present — we delete in the right order ourselves).
  const { rows: orgRows } = await pool.query(
    `SELECT DISTINCT "organizationId" AS id
       FROM "member"
      WHERE "userId" = ANY($1::text[]) AND role = 'owner'`,
    [userIds],
  )
  const orgIds = orgRows.map((r: { id: string }) => r.id)

  if (orgIds.length > 0) {
    // Listings + claims + reports + sms_logs cascade off food_listings via FKs.
    await pool.query(
      `DELETE FROM food_listings WHERE restaurant_id = ANY($1::text[])`,
      [orgIds],
    )
    await pool.query(
      `DELETE FROM claims WHERE claimant_org_id = ANY($1::text[])`,
      [orgIds],
    )
    await pool.query(
      `DELETE FROM "member" WHERE "organizationId" = ANY($1::text[])`,
      [orgIds],
    )
    await pool.query(
      `DELETE FROM "invitation" WHERE "organizationId" = ANY($1::text[])`,
      [orgIds],
    )
    await pool.query(`DELETE FROM "organization" WHERE id = ANY($1::text[])`, [
      orgIds,
    ])
  }

  // Drop reports filed by these users (free-floating reports without listings).
  await pool.query(`DELETE FROM reports WHERE reporter_id = ANY($1::text[])`, [
    userIds,
  ])

  // Drop better-auth tables for these users.
  await pool.query(`DELETE FROM "session" WHERE "userId" = ANY($1::text[])`, [
    userIds,
  ])
  await pool.query(`DELETE FROM "account" WHERE "userId" = ANY($1::text[])`, [
    userIds,
  ])
  await pool.query(
    `DELETE FROM "verification" WHERE identifier = ANY($1::text[])`,
    [emails],
  )
  await pool.query(`DELETE FROM "user" WHERE id = ANY($1::text[])`, [userIds])
}

async function createUser(u: SeedUser): Promise<string> {
  // Better Auth's signUpEmail handles password hashing + account row creation.
  // The role hook in src/lib/auth.ts coerces ADMIN→RESTAURANT during signup,
  // so we sign up everyone as their requested role and SQL-promote ADMIN
  // afterwards (as documented in the QA report).
  const res = await auth.api.signUpEmail({
    body: {
      email: u.email,
      password: PASSWORD,
      name: u.name,
      // The auth before-hook strips ADMIN; restaurant becomes the safe default.
      role: u.role === 'ADMIN' ? 'RESTAURANT' : u.role,
    },
  })
  const userId = (res.user as { id: string }).id

  if (u.role === 'ADMIN') {
    await pool.query(`UPDATE "user" SET role = 'ADMIN' WHERE id = $1`, [userId])
  }

  return userId
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'org'
  )
}

async function createOrg(spec: SeedOrg, ownerId: string): Promise<string> {
  const orgId = crypto.randomUUID()
  const slug = `${slugify(spec.name)}-${crypto.randomUUID().slice(0, 8)}`
  const verifiedAt = spec.status === 'VERIFIED' ? new Date() : null

  await pool.query(
    `INSERT INTO "organization"
        (id, name, slug, type, description, phone, address, "cityId",
         latitude, longitude, "verificationStatus", "verifiedAt", "createdAt", metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NULL)`,
    [
      orgId,
      spec.name,
      slug,
      spec.type,
      `Seeded ${spec.status.toLowerCase()} ${spec.type.toLowerCase()} for QA`,
      spec.phone,
      spec.address,
      spec.cityId,
      spec.latitude,
      spec.longitude,
      spec.status,
      verifiedAt,
    ],
  )
  await pool.query(
    `INSERT INTO "member" (id, "organizationId", "userId", role, "createdAt")
       VALUES ($1,$2,$3,'owner',NOW())`,
    [crypto.randomUUID(), orgId, ownerId],
  )
  return orgId
}

async function createListings(
  restaurantOrgId: string,
  ownerUserId: string,
): Promise<void> {
  // Hour offsets: pickup window is 1h–4h from now for active listings; the
  // expired one has both pickup_end and expiry already in the past.
  const now = new Date()
  const inHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000)

  const seeds = [
    {
      title: 'Veg biryani lunch surplus',
      description: "2 trays of veg biryani from today's lunch service.",
      quantity: '5.00',
      quantityUnit: 'plates',
      foodCategory: 'HUMAN_SAFE',
      foodType: 'COOKED',
      pickupStartTime: inHours(1),
      pickupEndTime: inHours(4),
      expiryTime: inHours(6),
    },
    {
      title: 'Bakery loaves end-of-day',
      description: 'Fresh sandwich loaves, end-of-day stock.',
      quantity: '12.00',
      quantityUnit: 'units',
      foodCategory: 'HUMAN_SAFE',
      foodType: 'BAKERY',
      pickupStartTime: inHours(1),
      pickupEndTime: inHours(5),
      expiryTime: inHours(8),
    },
    {
      title: 'Curd rice scraps for strays',
      description: 'Plain curd rice trimmings, no spice — animal-safe.',
      quantity: '3.50',
      quantityUnit: 'kg',
      foodCategory: 'ANIMAL_SAFE',
      foodType: 'COOKED',
      pickupStartTime: inHours(1),
      pickupEndTime: inHours(4),
      expiryTime: inHours(6),
    },
    {
      title: 'Stale pakoras (past pickup)',
      description:
        'Test fixture: pickup window already closed; sweep should EXPIRE.',
      quantity: '2.00',
      quantityUnit: 'kg',
      foodCategory: 'HUMAN_SAFE',
      foodType: 'COOKED',
      pickupStartTime: inHours(-4),
      pickupEndTime: inHours(-2),
      expiryTime: inHours(-1),
    },
  ]

  for (const s of seeds) {
    await pool.query(
      `INSERT INTO food_listings
          (id, restaurant_id, created_by_id, city_id, title, description,
           quantity, quantity_unit, food_category, food_type,
           pickup_start_time, pickup_end_time, expiry_time,
           latitude, longitude, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::food_category,$10,$11,$12,$13,$14,$15,'AVAILABLE')`,
      [
        crypto.randomUUID(),
        restaurantOrgId,
        ownerUserId,
        'city_blr',
        s.title,
        s.description,
        s.quantity,
        s.quantityUnit,
        s.foodCategory,
        s.foodType,
        s.pickupStartTime,
        s.pickupEndTime,
        s.expiryTime,
        '12.9716',
        '77.5946',
      ],
    )
  }
}

async function main(): Promise<void> {
  console.log('[seed] cities…')
  await ensureCities()

  console.log('[seed] dropping previous seed data…')
  await dropSeedData()

  console.log('[seed] creating users…')
  const userIdByEmail: Record<string, string> = {}
  for (const u of USERS) {
    userIdByEmail[u.email] = await createUser(u)
    console.log(`  + ${u.email}  (${u.role})`)
  }

  console.log('[seed] creating organizations…')
  let verifiedRestaurantOrgId = ''
  for (const o of ORGS) {
    const ownerId = userIdByEmail[o.ownerEmail]
    if (!ownerId) {
      throw new Error(`Missing owner for org ${o.name}: ${o.ownerEmail}`)
    }
    const id = await createOrg(o, ownerId)
    if (o.type === 'RESTAURANT' && o.status === 'VERIFIED') {
      verifiedRestaurantOrgId = id
    }
    console.log(`  + ${o.name}  (${o.type}/${o.status})`)
  }

  if (!verifiedRestaurantOrgId) {
    throw new Error(
      'Verified restaurant org was not created — cannot seed listings',
    )
  }

  console.log('[seed] creating sample listings…')
  await createListings(
    verifiedRestaurantOrgId,
    userIdByEmail['verified-restaurant@foodsetu.dev'],
  )
  for (const t of SEED_LISTING_TITLES) console.log(`  + ${t}`)

  console.log('\n[seed] done. Sign in with password:', PASSWORD)
  for (const u of USERS) console.log(`  ${u.role.padEnd(14)} ${u.email}`)
}

main()
  .then(async () => {
    await pool.end()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('[seed] FAILED:', err)
    await pool.end().catch(() => {})
    process.exit(1)
  })
