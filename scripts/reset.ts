/**
 * Drops and rebuilds the demo database: schema → migrations → seed (04-veri §11).
 * Refuses to run unless PLATFORM_DEMO=true. Run with: pnpm db:reset
 */
import { execSync } from "node:child_process";

import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { env } = await import("@/lib/env");
  const { db } = await import("@/server/db/client");
  const { sql } = await import("drizzle-orm");

  if (!env.PLATFORM_DEMO) {
    console.error(
      "✖ db:reset yalnızca PLATFORM_DEMO=true iken çalışır. Canlı veritabanı sıfırlanmaz.",
    );
    process.exit(1);
  }

  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  console.log("✓ Şema temizlendi");

  execSync("pnpm db:migrate", { stdio: "inherit" });
  execSync("pnpm db:seed", { stdio: "inherit" });
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
