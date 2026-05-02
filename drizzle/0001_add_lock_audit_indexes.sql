DROP INDEX "claims_active_otp_uq";--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "otp_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "otp_verified_by" text;--> statement-breakpoint
ALTER TABLE "food_listings" ADD COLUMN "accepted_claim_id" text;--> statement-breakpoint
ALTER TABLE "food_listings" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "claims_listing_otp_uq" ON "claims" USING btree ("food_listing_id","otp_code") WHERE otp_code is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "claims_listing_active_uq" ON "claims" USING btree ("food_listing_id") WHERE status in ('PENDING','ACCEPTED','PICKED_UP');--> statement-breakpoint
CREATE INDEX "food_listings_active_feed_idx" ON "food_listings" USING btree ("city_id","food_category","pickup_end_time") WHERE status = 'AVAILABLE';