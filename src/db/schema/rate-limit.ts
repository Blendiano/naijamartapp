import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";

// ============================================================
// Rate Limits
// ------------------------------------------------------------
// Shared, cross-instance counters for abuse protection.
//
// The application deploys to more than one server instance, so an
// in-memory counter would only ever throttle the instance that
// happened to serve a request. Persisting counters in the existing
// Neon PostgreSQL database makes the limits effective across every
// instance without adding a dependency or a third-party store.
//
// One row per (scope, key) pair. `key` is a *hash* of the thing being
// limited (email address, client IP) so raw identifiers are not
// stored here.
// ============================================================
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    counterKey: text("counter_key").notNull(),
    count: integer("count").notNull().default(0),
    windowStartedAt: timestamp("window_started_at", {
      mode: "date",
    }).notNull(),
    windowExpiresAt: timestamp("window_expires_at", {
      mode: "date",
    }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("rate_limits_expires_idx").on(table.windowExpiresAt),
    index("rate_limits_scope_key_idx").on(table.scope, table.counterKey),
  ]
);
