import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * Integration global setup: apply every migration to the test database first (also proves
 * they run on an empty database, 14-test §4). Refuses anything that is not a *_test database.
 */
export default async function setup() {
  loadEnvConfig(process.cwd());
  // eslint-disable-next-line no-restricted-properties -- runs before the app modules; must not import env.ts
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test")) {
    throw new Error("Integration tests only run against a *_test database (see .env.test).");
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: "drizzle" });
  } finally {
    await pool.end();
  }
}
