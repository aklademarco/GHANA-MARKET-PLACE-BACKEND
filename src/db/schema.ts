import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";

const TABLE_PREFIX = "GMP_";

// Users table
export const users = pgTable(`${TABLE_PREFIX}users`, {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("customer"), // customer, seller, admin
  phone: varchar("phone", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable(`${TABLE_PREFIX}categories`, {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable(`${TABLE_PREFIX}products`, {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: json("images").$type<string[]>().default([]), // Array of image URLs
  category: varchar("category", { length: 100 }).notNull(),
  subCategory: varchar("sub_category", { length: 100 }),
  sizes: json("sizes").$type<string[]>().default([]), // ["S", "M", "L"]
  inStock: boolean("in_stock").default(true),
  bestSeller: boolean("best_seller").default(false),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  sellerId: integer("seller_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable(`${TABLE_PREFIX}orders`, {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Nullable for guest orders
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, processing, shipped, delivered, cancelled
  shippingAddress: json("shipping_address").$type<{
    homeAddress: string;
    city: string;
    regionOrState: string;
    country: string;
    zipCode: string;
  }>(),
  guestInfo: json("guest_info").$type<{
    name: string;
    email: string;
    phone: string;
  }>(), // For guest checkout
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order Items table
export const orderItems = pgTable(`${TABLE_PREFIX}order_items`, {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  size: varchar("size", { length: 50 }),
});

// Cart table
export const cart = pgTable(`${TABLE_PREFIX}cart`, {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull().default(1),
  size: varchar("size", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table
export const reviews = pgTable(`${TABLE_PREFIX}reviews`, {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
