import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@internal/shared";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  // Don't exit process, just log
});
export const db = drizzle(pool, { schema });
