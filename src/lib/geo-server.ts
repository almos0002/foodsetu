import { pool } from './auth'
import type { FoodCategory } from './permissions'

// ---------------------------------------------------------------------------
// Haversine distance
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance in kilometers between two lat/lng points. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

// ---------------------------------------------------------------------------
// getNearbyListings
// ---------------------------------------------------------------------------

export const DEFAULT_RADIUS_KM = 10
export const DEFAULT_NEARBY_LIMIT = 50
/** Hard cap to keep page-load queries cheap regardless of caller-supplied limit. */
export const MAX_NEARBY_LIMIT = 200

export type NearbyListingRow = {
  id: string
  title: string
  description: string | null
  quantity: number
  quantityUnit: string
  foodCategory: string
  foodType: string
  pickupStartTime: string
  pickupEndTime: string
  expiryTime: string
  latitude: number
  longitude: number
  imageUrl: string | null
  status: string
  createdAt: string
  restaurantId: string
  restaurantName: string | null
  restaurantAddress: string | null
  cityName: string | null
  /** Great-circle distance from the search origin, kilometers. */
  distanceKm: number
}

export type GetNearbyListingsArgs = {
  /** Search origin latitude (degrees). */
  latitude: number
  /** Search origin longitude (degrees). */
  longitude: number
  /** Inclusive radius in kilometers. Defaults to {@link DEFAULT_RADIUS_KM}. */
  radiusKm?: number
  /** Restrict to a single food category (HUMAN_SAFE / ANIMAL_SAFE / ...). */
  foodCategory: FoodCategory
  /** Max rows to return. Capped at {@link MAX_NEARBY_LIMIT}. */
  limit?: number
}

/**
 * Returns AVAILABLE, non-expired food listings of the given category that lie
 * within `radiusKm` of the (latitude, longitude) origin, enriched with
 * restaurant info and the great-circle distance from the origin.
 *
 * Sort order:
 *   1. Expiry soonest first (so urgency wins over distance).
 *   2. Nearest distance first as a tiebreaker.
 *
 * Filters applied (in this order):
 *   - food_category = `foodCategory`        ← role gate (NGO=HUMAN_SAFE, AR=ANIMAL_SAFE)
 *   - status = 'AVAILABLE'                  ← only claimable listings
 *   - expiry_time > NOW() AND pickup_end_time > NOW()  ← exclude expired/past pickup
 *   - bounding-box pre-filter on lat/lng    ← cheap SQL narrowing
 *   - exact Haversine ≤ radiusKm            ← exact in-app filter
 *
 * The bounding-box pre-filter cuts the candidate set down to a small box
 * (roughly 2*radiusKm on a side) before we compute exact distances in app
 * code. The bounding box is approximate (over-includes corners and degrades
 * near the poles), so the exact Haversine pass below is required to honor
 * the radius precisely.
 *
 * Caller is responsible for any auth / role / org gating — this function is
 * deliberately context-free so it can be reused from any nearby-food UI
 * (NGO feed, animal-rescue feed, future map view, dashboard widget, etc.).
 */
export async function getNearbyListings({
  latitude,
  longitude,
  radiusKm = DEFAULT_RADIUS_KM,
  foodCategory,
  limit = DEFAULT_NEARBY_LIMIT,
}: GetNearbyListingsArgs): Promise<NearbyListingRow[]> {
  // Validate inputs up-front. These are programmer errors, not user errors,
  // so throwing is appropriate (caller should pre-validate user input).
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('latitude must be a number between -90 and 90')
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('longitude must be a number between -180 and 180')
  }
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    throw new Error('radiusKm must be a positive number')
  }
  if (!Number.isFinite(limit)) {
    throw new Error('limit must be a positive integer')
  }
  // Floor first, then validate, so fractional values like 0.5 fail the
  // "≥ 1" check rather than silently becoming 0 and returning no rows.
  const flooredLimit = Math.floor(limit)
  if (flooredLimit < 1) {
    throw new Error('limit must be at least 1')
  }
  const cappedLimit = Math.min(flooredLimit, MAX_NEARBY_LIMIT)

  // Bounding box around the origin. 1 deg latitude ≈ 111 km; 1 deg longitude
  // ≈ 111*cos(lat) km. We clamp lat to [-90, 90] but intentionally do NOT
  // wrap longitude across the antimeridian — relevant data is in Nepal (lon
  // ≈ 80..89) so wraparound is not a concern in practice. cos(lat) can hit
  // zero at the poles; the `|| 1e-6` keeps us from dividing by zero (and at
  // those latitudes the bounding box collapses to "the whole world", which
  // is fine because the exact Haversine pass below still enforces the radius).
  const latRad = toRadians(latitude)
  const latDelta = radiusKm / 111
  const lngDelta = radiusKm / (111 * Math.cos(latRad) || 1e-6)
  const minLat = Math.max(-90, latitude - latDelta)
  const maxLat = Math.min(90, latitude + latDelta)
  const minLng = longitude - lngDelta
  const maxLng = longitude + lngDelta

  // Over-fetch generously so the in-app exact-distance pass has enough
  // candidates to fill `cappedLimit` even after radius rejection. The
  // `ORDER BY fl.expiry_time ASC` is critical for correctness: combined
  // with the final sort being expiry-first, it guarantees that any
  // listing dropped by the SQL LIMIT has a strictly later expiry than
  // every row we kept, so the top-N by (expiry asc, distance asc) is
  // preserved even in dense bounding boxes. Without ORDER BY, Postgres
  // could hand back an arbitrary subset and we'd silently miss
  // earlier-expiring rows.
  const sqlOverFetch = Math.max(cappedLimit * 4, 200)

  const { rows } = await pool.query(
    `SELECT fl.id, fl.title, fl.description, fl.quantity, fl.quantity_unit,
            fl.food_category, fl.food_type,
            fl.pickup_start_time, fl.pickup_end_time, fl.expiry_time,
            fl.latitude, fl.longitude, fl.image_url, fl.status, fl.created_at,
            fl.restaurant_id,
            o.name AS restaurant_name,
            o.address AS restaurant_address,
            c.name AS city_name
       FROM food_listings fl
       LEFT JOIN "organization" o ON o.id = fl.restaurant_id
       LEFT JOIN cities c ON c.id = fl.city_id
      WHERE fl.food_category = $1
        AND fl.status = 'AVAILABLE'
        AND fl.expiry_time > NOW()
        AND fl.pickup_end_time > NOW()
        AND fl.latitude BETWEEN $2 AND $3
        AND fl.longitude BETWEEN $4 AND $5
      ORDER BY fl.expiry_time ASC
      LIMIT $6`,
    [foodCategory, minLat, maxLat, minLng, maxLng, sqlOverFetch],
  )

  const enriched: NearbyListingRow[] = []
  for (const r of rows) {
    const lat = Number(r.latitude)
    const lng = Number(r.longitude)
    const distanceKm = haversineKm(latitude, longitude, lat, lng)
    if (distanceKm > radiusKm) continue
    enriched.push({
      id: r.id,
      title: r.title,
      description: r.description,
      quantity: Number(r.quantity),
      quantityUnit: r.quantity_unit,
      foodCategory: r.food_category,
      foodType: r.food_type,
      pickupStartTime: new Date(r.pickup_start_time).toISOString(),
      pickupEndTime: new Date(r.pickup_end_time).toISOString(),
      expiryTime: new Date(r.expiry_time).toISOString(),
      latitude: lat,
      longitude: lng,
      imageUrl: r.image_url,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      restaurantId: r.restaurant_id,
      restaurantName: r.restaurant_name,
      restaurantAddress: r.restaurant_address,
      cityName: r.city_name,
      distanceKm,
    })
  }

  // Sort: expiry soonest first, then nearest distance as a tiebreaker.
  // Urgency wins because near-expiry food is the most perishable; distance
  // only breaks ties between similarly-expiring listings.
  enriched.sort((a, b) => {
    const ea = new Date(a.expiryTime).getTime()
    const eb = new Date(b.expiryTime).getTime()
    if (ea !== eb) return ea - eb
    return a.distanceKm - b.distanceKm
  })

  return enriched.slice(0, cappedLimit)
}
