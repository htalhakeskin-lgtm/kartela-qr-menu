/**
 * Demo data (04-veri §11, 17-icerik-ve-demo-verisi). Deterministic and idempotent: running it
 * twice gives the same result. Run with: pnpm db:seed   (tsx --conditions=react-server)
 *
 * Seeds the platform row, the demo platform admin, the registry's venues (D-02: venue row,
 * settings, domains) and their menu content files (D-04: content/mekanlar/{ad}/menu.ts, written
 * only into a venue without a menu). Stories follow with D-07.
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
  const { venues: registry } = await import("@/platform/tenant/registry");
  const { seedVenues } = await import("@/server/db/tenant/seed-venues");
  const { seedVenueContent } = await import("@/server/db/tenant/seed-content");
  const { parseMenuContent } = await import("@/platform/menu/content");
  const { venueContents } = await import("../content/mekanlar/icerik");

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
  const venueIds = await seedVenues(registry);
  console.log(`✓ Mekânlar: ${[...venueIds.keys()].join(", ")}`);

  // Content goes only into a venue without a menu (panel edits survive a deploy);
  // --icerik-yenile rewrites it from the files (local content work; db:reset starts empty anyway).
  const replace = process.argv.includes("--icerik-yenile");
  for (const [slug, venueId] of venueIds) {
    const input = venueContents[slug];
    if (!input) continue;
    const result = await seedVenueContent(venueId, parseMenuContent(slug, input), { replace });
    console.log(
      result.written
        ? `✓ ${slug}: ${String(result.menus)} menü, ${String(result.items)} ürün, ${String(result.optionGroups)} seçenek grubu, ${String(result.images)} görsel`
        : `· ${slug}: menüsü var, içerik yazılmadı (yenilemek için: pnpm db:seed --icerik-yenile)`,
    );
  }
  console.log("✓ Seed tamamlandı");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
