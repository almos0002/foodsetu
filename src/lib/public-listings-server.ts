import { createServerFn } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'
import { db } from '../db'
import type { FoodCategory } from './permissions'

export type PublicListingRow = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  quantity: number
  quantityUnit: string
  foodCategory: string
  foodType: string
  pickupStartTime: string
  pickupEndTime: string
  expiryTime: string
  cityName: string | null
  orgName: string | null
}

type Filter = { category?: FoodCategory | 'ALL'; limit?: number }

function validatePublicInput(value: unknown): Required<Filter> {
  const v = (value ?? {}) as Record<string, unknown>
  const category =
    v.category === 'HUMAN_SAFE' || v.category === 'ANIMAL_SAFE'
      ? v.category
      : 'ALL'
  const limitRaw = typeof v.limit === 'number' ? v.limit : undefined
  const limit = Math.min(Math.max(limitRaw ?? 12, 1), 60)
  return { category, limit }
}

/**
 * Public listings feed for the marketing homepage and the /listings browse
 * page. Returns claimable listings only — no PII, no exact lat/lng, no
 * claimant info. Safe to call without a session.
 *
 * Uses a raw SQL template (with explicit ::text casts on enum columns) so we
 * can join Better Auth's organization table without modeling it in drizzle.
 */
export const listPublicAvailableListingsFn = createServerFn({ method: 'GET' })
  .inputValidator(validatePublicInput)
  .handler(async ({ data }) => {
    const result = await db.execute<{
      id: string
      title: string
      description: string | null
      image_url: string | null
      quantity: string
      quantity_unit: string
      food_category: string
      food_type: string
      pickup_start_time: Date
      pickup_end_time: Date
      expiry_time: Date
      city_name: string | null
      org_name: string | null
    }>(sql`
      SELECT l.id,
             l.title,
             l.description,
             l.image_url,
             l.quantity::text AS quantity,
             l.quantity_unit,
             l.food_category::text AS food_category,
             l.food_type,
             l.pickup_start_time,
             l.pickup_end_time,
             l.expiry_time,
             c.name AS city_name,
             o.name AS org_name
        FROM food_listings l
        LEFT JOIN cities c ON c.id = l.city_id
        LEFT JOIN "organization" o ON o.id = l.restaurant_id
       WHERE l.status::text IN ('AVAILABLE', 'CLAIM_REQUESTED', 'CLAIMED')
         AND (
           ${data.category === 'ALL' ? sql`TRUE` : sql`l.food_category::text = ${data.category}`}
         )
       ORDER BY l.created_at DESC
       LIMIT ${data.limit}
    `)

    const rows = (result as unknown as { rows?: unknown[] }).rows ?? []

    return rows.map((raw): PublicListingRow => {
      const r = raw as {
        id: string
        title: string
        description: string | null
        image_url: string | null
        quantity: string
        quantity_unit: string
        food_category: string
        food_type: string
        pickup_start_time: Date | string
        pickup_end_time: Date | string
        expiry_time: Date | string
        city_name: string | null
        org_name: string | null
      }
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        imageUrl: r.image_url,
        quantity: Number(r.quantity),
        quantityUnit: r.quantity_unit,
        foodCategory: r.food_category,
        foodType: r.food_type,
        pickupStartTime: new Date(r.pickup_start_time).toISOString(),
        pickupEndTime: new Date(r.pickup_end_time).toISOString(),
        expiryTime: new Date(r.expiry_time).toISOString(),
        cityName: r.city_name,
        orgName: r.org_name,
      }
    })
  })
