import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const createdAt = () =>
  timestamp('created_at', { withTimezone: true }).defaultNow().notNull()

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'RESTAURANT',
  'NGO',
  'ANIMAL_RESCUE',
])

export const orgTypeEnum = pgEnum('org_type', [
  'RESTAURANT',
  'NGO',
  'ANIMAL_RESCUE',
])

export const foodCategoryEnum = pgEnum('food_category', [
  'HUMAN_SAFE',
  'ANIMAL_SAFE',
  'COMPOST_ONLY',
])

export const foodListingStatusEnum = pgEnum('food_listing_status', [
  'DRAFT',
  'AVAILABLE',
  'CLAIM_REQUESTED',
  'CLAIMED',
  'PICKED_UP',
  'EXPIRED',
  'CANCELLED',
  'REPORTED',
])

export const claimStatusEnum = pgEnum('claim_status', [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'PICKED_UP',
  'COMPLETED',
])

export const verificationStatusEnum = pgEnum('verification_status', [
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
])

export const reportReasonEnum = pgEnum('report_reason', [
  'SPOILED',
  'MISLABELED',
  'NO_SHOW',
  'INAPPROPRIATE',
  'OTHER',
])

export const reportStatusEnum = pgEnum('report_status', [
  'OPEN',
  'REVIEWING',
  'RESOLVED',
  'DISMISSED',
])

export const smsStatusEnum = pgEnum('sms_status', [
  'QUEUED',
  'SENT',
  'DELIVERED',
  'FAILED',
])

export const smsPurposeEnum = pgEnum('sms_purpose', [
  'OTP',
  'NEW_LISTING_ALERT',
  'CLAIM_ACCEPTED',
  'PICKUP_REMINDER',
  'GENERIC',
])

export const cities = pgTable(
  'cities',
  {
    id: id(),
    name: text('name').notNull(),
    state: text('state').notNull(),
    country: text('country').notNull().default('IN'),
    slug: text('slug').notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('cities_slug_uq').on(t.slug),
    index('cities_state_idx').on(t.state),
  ],
)

export const foodListings = pgTable(
  'food_listings',
  {
    id: id(),
    restaurantId: text('restaurant_id').notNull(),
    createdById: text('created_by_id'),
    cityId: text('city_id').references(() => cities.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(),
    quantityUnit: text('quantity_unit').notNull(),
    foodCategory: foodCategoryEnum('food_category').notNull(),
    foodType: text('food_type').notNull(),
    pickupStartTime: timestamp('pickup_start_time', {
      withTimezone: true,
    }).notNull(),
    pickupEndTime: timestamp('pickup_end_time', {
      withTimezone: true,
    }).notNull(),
    expiryTime: timestamp('expiry_time', { withTimezone: true }).notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
    status: foodListingStatusEnum('status').notNull().default('DRAFT'),
    imageUrl: text('image_url'),
    acceptedClaimId: text('accepted_claim_id'),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('food_listings_status_idx').on(t.status),
    index('food_listings_category_status_idx').on(t.foodCategory, t.status),
    index('food_listings_restaurant_idx').on(t.restaurantId),
    index('food_listings_city_idx').on(t.cityId),
    index('food_listings_pickup_end_idx').on(t.pickupEndTime),
    index('food_listings_active_feed_idx')
      .on(t.cityId, t.foodCategory, t.pickupEndTime)
      .where(sql`status = 'AVAILABLE'`),
  ],
)

// NOTE on otp_code: stored in plaintext per the v1 spec. For production,
// switch to a hashed column (HMAC/argon2) and compare by hash; never log.
export const claims = pgTable(
  'claims',
  {
    id: id(),
    foodListingId: text('food_listing_id')
      .notNull()
      .references(() => foodListings.id, { onDelete: 'cascade' }),
    claimantOrgId: text('claimant_org_id').notNull(),
    claimantUserId: text('claimant_user_id'),
    status: claimStatusEnum('status').notNull().default('PENDING'),
    pickupTime: timestamp('pickup_time', { withTimezone: true }),
    otpCode: text('otp_code'),
    otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true }),
    otpVerifiedAt: timestamp('otp_verified_at', { withTimezone: true }),
    otpVerifiedBy: text('otp_verified_by'),
    proofImageUrl: text('proof_image_url'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('claims_listing_idx').on(t.foodListingId),
    index('claims_org_idx').on(t.claimantOrgId),
    index('claims_status_idx').on(t.status),
    // OTP unique scoped to a listing (avoids global collision pressure on 6-digit codes)
    uniqueIndex('claims_listing_otp_uq')
      .on(t.foodListingId, t.otpCode)
      .where(sql`otp_code is not null`),
    // Enforce one active claim per listing (first-to-lock rule from WORKFLOW.md)
    uniqueIndex('claims_listing_active_uq')
      .on(t.foodListingId)
      .where(sql`status in ('PENDING','ACCEPTED','PICKED_UP')`),
  ],
)

export const reports = pgTable(
  'reports',
  {
    id: id(),
    // Nullable so reports about a "fake organization" or other generic
    // platform issues can be filed without an associated listing. Most
    // reports do reference a listing — the /reports/new form captures it
    // from the `?listingId=` query param when the user opens the form
    // from a listing-context surface (claim card, listing detail, etc).
    foodListingId: text('food_listing_id').references(() => foodListings.id, {
      onDelete: 'cascade',
    }),
    claimId: text('claim_id').references(() => claims.id, {
      onDelete: 'set null',
    }),
    reporterId: text('reporter_id').notNull(),
    reporterOrgId: text('reporter_org_id'),
    reason: reportReasonEnum('reason').notNull(),
    description: text('description'),
    status: reportStatusEnum('status').notNull().default('OPEN'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('reports_listing_idx').on(t.foodListingId),
    index('reports_status_idx').on(t.status),
    index('reports_reporter_idx').on(t.reporterId),
  ],
)

export const smsLogs = pgTable(
  'sms_logs',
  {
    id: id(),
    toPhone: text('to_phone').notNull(),
    body: text('body').notNull(),
    purpose: smsPurposeEnum('purpose').notNull().default('GENERIC'),
    status: smsStatusEnum('status').notNull().default('QUEUED'),
    providerMessageId: text('provider_message_id'),
    error: text('error'),
    relatedListingId: text('related_listing_id').references(
      () => foodListings.id,
      { onDelete: 'set null' },
    ),
    relatedClaimId: text('related_claim_id').references(() => claims.id, {
      onDelete: 'set null',
    }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index('sms_logs_phone_idx').on(t.toPhone),
    index('sms_logs_status_idx').on(t.status),
    index('sms_logs_created_at_idx').on(t.createdAt),
  ],
)

export const citiesRelations = relations(cities, ({ many }) => ({
  listings: many(foodListings),
}))

export const foodListingsRelations = relations(
  foodListings,
  ({ one, many }) => ({
    city: one(cities, {
      fields: [foodListings.cityId],
      references: [cities.id],
    }),
    claims: many(claims),
    reports: many(reports),
  }),
)

export const claimsRelations = relations(claims, ({ one, many }) => ({
  listing: one(foodListings, {
    fields: [claims.foodListingId],
    references: [foodListings.id],
  }),
  reports: many(reports),
}))

export const reportsRelations = relations(reports, ({ one }) => ({
  listing: one(foodListings, {
    fields: [reports.foodListingId],
    references: [foodListings.id],
  }),
  claim: one(claims, {
    fields: [reports.claimId],
    references: [claims.id],
  }),
}))

export const smsLogsRelations = relations(smsLogs, ({ one }) => ({
  listing: one(foodListings, {
    fields: [smsLogs.relatedListingId],
    references: [foodListings.id],
  }),
  claim: one(claims, {
    fields: [smsLogs.relatedClaimId],
    references: [claims.id],
  }),
}))

export type City = typeof cities.$inferSelect
export type NewCity = typeof cities.$inferInsert
export type FoodListing = typeof foodListings.$inferSelect
export type NewFoodListing = typeof foodListings.$inferInsert
export type Claim = typeof claims.$inferSelect
export type NewClaim = typeof claims.$inferInsert
export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
export type SmsLog = typeof smsLogs.$inferSelect
export type NewSmsLog = typeof smsLogs.$inferInsert
