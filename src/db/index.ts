import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// Use DIRECT env access here (not src/env.ts) to avoid circular imports
// during build-time schema introspection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your environment (e.g. .env.local)."
  );
}

// The WebSocket (Pool) driver is required for interactive transactions
// (`db.transaction(...)`). The HTTP driver (drizzle-orm/neon-http) does not
// support them, so checkout order creation and admin product creation rely
// on this driver.
const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export type DB = typeof db;
