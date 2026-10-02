import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use DIRECT env access here (not src/env.ts) to avoid circular imports
// during build-time schema introspection
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/naijamart";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

export type DB = typeof db;
