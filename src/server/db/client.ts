import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import * as schema from "./schema";

/**
 * Same driver locally (Docker) and on Neon (pooled URL), so demo → live needs no code change
 * (01-teknoloji-yigini TY-03). On Vercel, consider attachDatabasePool from @vercel/functions.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };
export const pool = globalForDb.pool ?? new Pool({ connectionString: env.DATABASE_URL, max: 5 });
if (env.NODE_ENV !== "production") globalForDb.pool = pool; // survive dev hot reloads

/**
 * Platform-level access (auth, platform_settings, venues, rate limits) with the owner role.
 * Tenant tables are not in this schema: they are reached through withVenue() (ADR-0004).
 */
export const db = drizzle({ client: pool, schema, casing: "snake_case" });
export type Db = typeof db;
