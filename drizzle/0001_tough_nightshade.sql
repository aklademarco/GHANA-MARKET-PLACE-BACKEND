ALTER TABLE "GMP_orders" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "GMP_orders" ADD COLUMN "guest_info" json;