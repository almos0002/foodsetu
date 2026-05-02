CREATE TYPE "public"."claim_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'PICKED_UP', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."food_category" AS ENUM('HUMAN_SAFE', 'ANIMAL_SAFE', 'COMPOST_ONLY');--> statement-breakpoint
CREATE TYPE "public"."food_listing_status" AS ENUM('DRAFT', 'AVAILABLE', 'CLAIM_REQUESTED', 'CLAIMED', 'PICKED_UP', 'EXPIRED', 'CANCELLED', 'REPORTED');--> statement-breakpoint
CREATE TYPE "public"."org_type" AS ENUM('RESTAURANT', 'NGO', 'ANIMAL_RESCUE');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('SPOILED', 'MISLABELED', 'NO_SHOW', 'INAPPROPRIATE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."sms_purpose" AS ENUM('OTP', 'NEW_LISTING_ALERT', 'CLAIM_ACCEPTED', 'PICKUP_REMINDER', 'GENERIC');--> statement-breakpoint
CREATE TYPE "public"."sms_status" AS ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'RESTAURANT', 'NGO', 'ANIMAL_RESCUE');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"country" text DEFAULT 'IN' NOT NULL,
	"slug" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" text PRIMARY KEY NOT NULL,
	"food_listing_id" text NOT NULL,
	"claimant_org_id" text NOT NULL,
	"claimant_user_id" text,
	"status" "claim_status" DEFAULT 'PENDING' NOT NULL,
	"pickup_time" timestamp with time zone,
	"otp_code" text,
	"otp_expires_at" timestamp with time zone,
	"proof_image_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"created_by_id" text,
	"city_id" text,
	"title" text NOT NULL,
	"description" text,
	"quantity" numeric(12, 2) NOT NULL,
	"quantity_unit" text NOT NULL,
	"food_category" "food_category" NOT NULL,
	"food_type" text NOT NULL,
	"pickup_start_time" timestamp with time zone NOT NULL,
	"pickup_end_time" timestamp with time zone NOT NULL,
	"expiry_time" timestamp with time zone NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"status" "food_listing_status" DEFAULT 'DRAFT' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"food_listing_id" text NOT NULL,
	"claim_id" text,
	"reporter_id" text NOT NULL,
	"reporter_org_id" text,
	"reason" "report_reason" NOT NULL,
	"description" text,
	"status" "report_status" DEFAULT 'OPEN' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"to_phone" text NOT NULL,
	"body" text NOT NULL,
	"purpose" "sms_purpose" DEFAULT 'GENERIC' NOT NULL,
	"status" "sms_status" DEFAULT 'QUEUED' NOT NULL,
	"provider_message_id" text,
	"error" text,
	"related_listing_id" text,
	"related_claim_id" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_food_listing_id_food_listings_id_fk" FOREIGN KEY ("food_listing_id") REFERENCES "public"."food_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_listings" ADD CONSTRAINT "food_listings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_food_listing_id_food_listings_id_fk" FOREIGN KEY ("food_listing_id") REFERENCES "public"."food_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_related_listing_id_food_listings_id_fk" FOREIGN KEY ("related_listing_id") REFERENCES "public"."food_listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_related_claim_id_claims_id_fk" FOREIGN KEY ("related_claim_id") REFERENCES "public"."claims"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cities_slug_uq" ON "cities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cities_state_idx" ON "cities" USING btree ("state");--> statement-breakpoint
CREATE INDEX "claims_listing_idx" ON "claims" USING btree ("food_listing_id");--> statement-breakpoint
CREATE INDEX "claims_org_idx" ON "claims" USING btree ("claimant_org_id");--> statement-breakpoint
CREATE INDEX "claims_status_idx" ON "claims" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "claims_active_otp_uq" ON "claims" USING btree ("otp_code") WHERE "claims"."otp_code" is not null and "claims"."status" in ('ACCEPTED','PICKED_UP');--> statement-breakpoint
CREATE INDEX "food_listings_status_idx" ON "food_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "food_listings_category_status_idx" ON "food_listings" USING btree ("food_category","status");--> statement-breakpoint
CREATE INDEX "food_listings_restaurant_idx" ON "food_listings" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "food_listings_city_idx" ON "food_listings" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "food_listings_pickup_end_idx" ON "food_listings" USING btree ("pickup_end_time");--> statement-breakpoint
CREATE INDEX "reports_listing_idx" ON "reports" USING btree ("food_listing_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_reporter_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "sms_logs_phone_idx" ON "sms_logs" USING btree ("to_phone");--> statement-breakpoint
CREATE INDEX "sms_logs_status_idx" ON "sms_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sms_logs_created_at_idx" ON "sms_logs" USING btree ("created_at");