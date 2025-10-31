CREATE TABLE "GMP_cart" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"size" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "GMP_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "GMP_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"size" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "GMP_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"shipping_address" json,
	"payment_status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "GMP_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"images" json DEFAULT '[]'::json,
	"category" varchar(100) NOT NULL,
	"sub_category" varchar(100),
	"sizes" json DEFAULT '[]'::json,
	"in_stock" boolean DEFAULT true,
	"best_seller" boolean DEFAULT false,
	"rating" numeric(2, 1) DEFAULT '0.0',
	"seller_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "GMP_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "GMP_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'customer',
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "GMP_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "GMP_cart" ADD CONSTRAINT "GMP_cart_user_id_GMP_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."GMP_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GMP_cart" ADD CONSTRAINT "GMP_cart_product_id_GMP_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."GMP_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GMP_order_items" ADD CONSTRAINT "GMP_order_items_order_id_GMP_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."GMP_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GMP_order_items" ADD CONSTRAINT "GMP_order_items_product_id_GMP_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."GMP_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GMP_orders" ADD CONSTRAINT "GMP_orders_user_id_GMP_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."GMP_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GMP_products" ADD CONSTRAINT "GMP_products_seller_id_GMP_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."GMP_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GMP_reviews" ADD CONSTRAINT "GMP_reviews_product_id_GMP_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."GMP_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "GMP_reviews" ADD CONSTRAINT "GMP_reviews_user_id_GMP_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."GMP_users"("id") ON DELETE no action ON UPDATE no action;