/**
 * Demo data (04-veri §11, 17-icerik-ve-demo-verisi). Deterministic and idempotent: running it
 * twice gives the same result. Run with: pnpm db:seed   (tsx --conditions=react-server)
 *
 * Seeds the platform row, the registry's venues (D-02: venue row, settings, domains), their menu
 * content files (D-04: content/mekanlar/{ad}/menu.ts, written only into a venue without a menu)
 * and — while PLATFORM_DEMO=true — the demo panel accounts, one per role (D-18,
 * config/demo-accounts.ts), all with DEMO_ADMIN_PASSWORD.
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
  const { eq } = await import("drizzle-orm");
  const { venues: registry } = await import("@/platform/tenant/registry");
  const { seedVenues } = await import("@/server/db/tenant/seed-venues");
  const { seedVenueContent } = await import("@/server/db/tenant/seed-content");
  const { addMember } = await import("@/server/db/tenant");
  const { DEMO_PLATFORM_ACCOUNT, DEMO_VENUE_ACCOUNTS } = await import("@/config/demo-accounts");
  const { loadVenueContent } = await import("@/server/content/venue-content");

  async function seedPlatform() {
    await db
      .insert(platformSettings)
      .values({ id: "singleton", ...platformDefaults })
      .onConflictDoNothing();
  }

  /** A demo user with a password account; returns its id (existing or new). */
  async function seedDemoUser(
    email: string,
    name: string,
    password: string,
    platformRole: "admin" | null,
  ): Promise<string> {
    const userId = newId();
    const [inserted] = await db
      .insert(users)
      .values({ id: userId, name, email, emailVerified: true, platformRole })
      .onConflictDoNothing()
      .returning({ id: users.id });
    if (inserted) {
      await db.insert(accounts).values({
        id: newId(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: await hashPassword(password),
      });
      return userId;
    }
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (!existing) throw new Error(`Demo kullanıcısı okunamadı: ${email}`);
    return existing.id;
  }

  async function seedDemoAccounts(venueIds: Map<string, string>) {
    if (!env.PLATFORM_DEMO || !env.DEMO_ADMIN_EMAIL || !env.DEMO_ADMIN_PASSWORD) return;
    await seedDemoUser(
      env.DEMO_ADMIN_EMAIL,
      DEMO_PLATFORM_ACCOUNT.name,
      env.DEMO_ADMIN_PASSWORD,
      "admin",
    );
    for (const account of DEMO_VENUE_ACCOUNTS) {
      const venueId = venueIds.get(account.venue);
      if (!venueId) continue;
      const userId = await seedDemoUser(account.email, account.name, env.DEMO_ADMIN_PASSWORD, null);
      await addMember(venueId, userId, account.role);
    }
    console.log(`✓ Demo hesapları: ${String(DEMO_VENUE_ACCOUNTS.length + 1)}`);
  }

  await seedPlatform();
  const venueIds = await seedVenues(registry);
  console.log(`✓ Mekânlar: ${[...venueIds.keys()].join(", ")}`);
  await seedDemoAccounts(venueIds);

  // Content goes only into a venue without a menu (panel edits survive a deploy);
  // --icerik-yenile rewrites it from the files (local content work; db:reset starts empty anyway).
  const replace = process.argv.includes("--icerik-yenile");
  for (const [slug, venueId] of venueIds) {
    const content = await loadVenueContent(slug);
    if (!content) continue;
    const result = await seedVenueContent(venueId, content, { replace });
    console.log(
      result.written
        ? `✓ ${slug}: ${String(result.menus)} menü, ${String(result.items)} ürün, ${String(result.optionGroups)} seçenek grubu, ${String(result.stories)} hikâye, ${String(result.images)} görsel`
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
