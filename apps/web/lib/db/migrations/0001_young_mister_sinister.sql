CREATE TYPE "public"."restaurant_cuisine" AS ENUM('italian', 'pizza', 'sushi', 'asian', 'salad', 'burger', 'bistro', 'bakery', 'fusion', 'other');--> statement-breakpoint
CREATE TYPE "public"."restaurant_price_range" AS ENUM('€', '€€', '€€€');--> statement-breakpoint
CREATE TYPE "public"."lunch_proposal_status" AS ENUM('open', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lunch_proposal_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "lunch_proposal_invites" (
	"proposal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lunch_proposal_participants" (
	"proposal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lunch_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"date" text NOT NULL,
	"meeting_time" text NOT NULL,
	"max_participants" integer,
	"note" text,
	"visibility" "lunch_proposal_visibility" DEFAULT 'public' NOT NULL,
	"status" "lunch_proposal_status" DEFAULT 'open' NOT NULL,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_ratings" (
	"restaurant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"score" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cuisine" "restaurant_cuisine" DEFAULT 'other' NOT NULL,
	"price_range" "restaurant_price_range" DEFAULT '€€' NOT NULL,
	"address" text NOT NULL,
	"distance_m" integer,
	"description" text,
	"emoji" text,
	"maps_url" text,
	"created_by" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lunch_proposal_invites" ADD CONSTRAINT "lunch_proposal_invites_proposal_id_lunch_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."lunch_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lunch_proposal_invites" ADD CONSTRAINT "lunch_proposal_invites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lunch_proposal_participants" ADD CONSTRAINT "lunch_proposal_participants_proposal_id_lunch_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."lunch_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lunch_proposal_participants" ADD CONSTRAINT "lunch_proposal_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lunch_proposals" ADD CONSTRAINT "lunch_proposals_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lunch_proposals" ADD CONSTRAINT "lunch_proposals_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_ratings" ADD CONSTRAINT "restaurant_ratings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_ratings" ADD CONSTRAINT "restaurant_ratings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lunch_invites_pair_pk" ON "lunch_proposal_invites" USING btree ("proposal_id","user_id");--> statement-breakpoint
CREATE INDEX "lunch_invites_user_idx" ON "lunch_proposal_invites" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lunch_participants_pair_pk" ON "lunch_proposal_participants" USING btree ("proposal_id","user_id");--> statement-breakpoint
CREATE INDEX "lunch_participants_user_idx" ON "lunch_proposal_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lunch_proposals_date_idx" ON "lunch_proposals" USING btree ("date");--> statement-breakpoint
CREATE INDEX "lunch_proposals_creator_date_idx" ON "lunch_proposals" USING btree ("created_by","date");--> statement-breakpoint
CREATE INDEX "lunch_proposals_status_idx" ON "lunch_proposals" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurant_ratings_pair_pk" ON "restaurant_ratings" USING btree ("restaurant_id","user_id");--> statement-breakpoint
CREATE INDEX "restaurant_ratings_restaurant_idx" ON "restaurant_ratings" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "restaurants_name_idx" ON "restaurants" USING btree ("name");--> statement-breakpoint
CREATE INDEX "restaurants_archived_idx" ON "restaurants" USING btree ("is_archived");