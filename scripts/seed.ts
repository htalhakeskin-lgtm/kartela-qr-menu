/**
 * Demo data (04-veri §11, 17-icerik-ve-demo-verisi). Deterministic and idempotent: running it
 * twice gives the same result. Run with: pnpm db:seed   (tsx --conditions=react-server)
 *
 * Faz 3 seeds the platform row and the demo platform admin. Venues, menus and stories come from
 * content/mekanlar/{ad}/ through the content pipeline (D-04).
 */
import { loadEnvConfig } from "@next/env";

// Load .env.local before any module that validates the environment is imported.
loadEnvConfig(process.cwd());

async function main() {
  const { env } = await import("@/lib/env");
  const { db } = await import("@/server/db/client");
  const { accounts, platformSettings, users } = await import("@/server/db/schema");
  const { newId } = await import("@/server/db/columns");
  const { platformDefaults } = await import("@/config/platform-defaults");
  const { hashPassword } = await import("better-auth/crypto");

  async function seedPlatform() {
    await db
      .insert(platformSettings)
      .values({ id: "singleton", ...platformDefaults })
      .onConflictDoNothing();
  }

  async function seedDemoAdmin() {
    if (!env.PLATFORM_DEMO || !env.DEMO_ADMIN_EMAIL || !env.DEMO_ADMIN_PASSWORD) return;
    const userId = newId();
    const inserted = await db
      .insert(users)
      .values({
        id: userId,
        name: "Demo Platform Yöneticisi",
        email: env.DEMO_ADMIN_EMAIL,
        emailVerified: true,
        platformRole: "admin",
      })
      .onConflictDoNothing()
      .returning({ id: users.id });
    if (inserted.length === 0) return; // already there
    await db.insert(accounts).values({
      id: newId(),
      userId,
      accountId: userId,
      providerId: "credential",
      password: await hashPassword(env.DEMO_ADMIN_PASSWORD),
    });
  }

  await seedPlatform();
  await seedDemoAdmin();
  console.log("✓ Seed tamamlandı");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
