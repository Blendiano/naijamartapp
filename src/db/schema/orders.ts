import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
  pgEnum,
  boolean,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { products, productVariants } from "./catalogue";
import { ORDER_STATUSES } from "@/lib/order-status";

// ============================================================
// Enums
// ============================================================
export const orderStatusEnum = pgEnum("order_status", [...ORDER_STATUSES]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "pending",
  "shipped",
  "in_transit",
  "delivered",
]);

// ============================================================
// Orders — store historical snapshot of customer & delivery info
// ============================================================
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Human-readable unique order number e.g. NJM-20260923-X4K2
    orderNumber: text("order_number").notNull().unique(),
    // Nullable: guest checkout orders have no userId
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    // Historical customer snapshot (preserved even if user profile changes)
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone").notNull(),

    // Historical delivery address snapshot as JSON
    deliveryAddress: jsonb("delivery_address").notNull(),

    // Historical delivery option snapshot
    deliveryOptionName: text("delivery_option_name").notNull(),
    // Fee in kobo
    deliveryFee: integer("delivery_fee").notNull(),

    // Financials in kobo
    subtotal: integer("subtotal").notNull(),
    total: integer("total").notNull(),
    currency: text("currency").notNull().default("NGN"),

    status: orderStatusEnum("status").notNull().default("pending"),

    notes: text("notes"),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_order_number_idx").on(table.orderNumber),
    index("orders_user_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
  ]
);

// ============================================================
// Order Items — historical product/variant snapshot
// ============================================================
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    // Snapshot fields — preserved regardless of product changes
    productName: text("product_name").notNull(),
    productSku: text("product_sku"),
    variantInfo: jsonb("variant_info"), // { size, color, sku }

    quantity: integer("quantity").notNull(),
    // Unit price in kobo at time of purchase
    unitPrice: integer("unit_price").notNull(),
    // subtotal = unitPrice * quantity in kobo
    subtotal: integer("subtotal").notNull(),

    // Optional back-references (nullable so order history survives product deletion)
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
  ]
);

// ============================================================
// Payments — one per order
// ============================================================
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: "cascade" }),

    // NaijaMart internal payment reference (sent to Paystack)
    reference: text("reference").notNull().unique(),
    // Paystack's own transaction reference (returned after initialization)
    providerReference: text("provider_reference").unique(),

    // Amount in kobo
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("NGN"),

    status: paymentStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { mode: "date" }),

    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payments_reference_idx").on(table.reference),
    uniqueIndex("payments_provider_reference_idx").on(table.providerReference),
    index("payments_order_idx").on(table.orderId),
  ]
);

// ============================================================
// Shipments
// ============================================================
export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    status: shipmentStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    shippedAt: timestamp("shipped_at", { mode: "date" }),
    deliveredAt: timestamp("delivered_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("shipments_order_idx").on(table.orderId),
    index("shipments_tracking_idx").on(table.trackingNumber),
  ]
);

// ============================================================
// Notifications
// ============================================================
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // e.g. "order_confirmed", "order_shipped"
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    metadata: jsonb("metadata"), // optional extra data
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.isRead),
  ]
);

// ============================================================
// Reviews
// ============================================================
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // orderId ensures the review is from a verified purchase
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("reviews_product_idx").on(table.productId),
    index("reviews_user_idx").on(table.userId),
    // One review per user per product (one-per-order enforced in service logic)
    check("reviews_rating_range", sql`${table.rating} >= 1 AND ${table.rating} <= 5`),
  ]
);
