import { createHmac, randomUUID } from "node:crypto";

import { expect, type Page } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";

/**
 * Panel test helpers (D-18). Each test makes its own user (14-test: no test leans on another's
 * data) straight in the database the server under test uses, and removes it afterwards. A user
 * row cascades to its accounts, sessions, second step and memberships.
 */
// eslint-disable-next-line no-restricted-properties -- test harness: the same variables as the server (playwright.config loads .env files)
const env = process.env;

function client() {
  return new pg.Client({ connectionString: env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL });
}

export type TestUser = { id: string; email: string; password: string };

export async function createPanelUser(options: {
  tag: string;
  membership?: { venue: string; role: "owner" | "manager" | "staff" };
  platformAdmin?: boolean;
}): Promise<TestUser> {
  const id = randomUUID();
  const email = `e2e-${options.tag}-${id.slice(0, 8)}@test.example.com`;
  const password = `e2e-parola-${randomUUID()}`;
  const db = client();
  await db.connect();
  try {
    await db.query("begin");
    await db.query(
      "insert into users (id, name, email, email_verified, platform_role, created_at, updated_at) values ($1, $2, $3, true, $4, now(), now())",
      [id, `E2E ${options.tag}`, email, options.platformAdmin ? "admin" : null],
    );
    await db.query(
      "insert into accounts (id, user_id, account_id, provider_id, password, created_at, updated_at) values ($1, $2, $2, 'credential', $3, now(), now())",
      [randomUUID(), id, await hashPassword(password)],
    );
    if (options.membership) {
      // venue_members is a tenant table: write it in the platform scope (ADR-0004).
      await db.query("select set_config('app.platform', 'on', true)");
      await db.query(
        "insert into venue_members (id, venue_id, user_id, role, created_at, updated_at) select $1, id, $2, $3, now(), now() from venues where slug = $4",
        [randomUUID(), id, options.membership.role, options.membership.venue],
      );
    }
    await db.query("commit");
  } finally {
    await db.end();
  }
  return { id, email, password };
}

export async function removePanelUser(user: TestUser | undefined): Promise<void> {
  if (!user) return;
  const db = client();
  await db.connect();
  try {
    await db.query("begin");
    await db.query("select set_config('app.platform', 'on', true)");
    await db.query("delete from venue_members where user_id = $1", [user.id]);
    await db.query("delete from users where id = $1", [user.id]);
    await db.query("commit");
  } finally {
    await db.end();
  }
}

/** RFC 6238 TOTP (SHA-1, 30 s, 6 digits) from the base32 key the setup page shows. */
export function totp(base32Key: string, now = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of base32Key.replace(/[\s=]/g, "").toUpperCase()) {
    bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  }
  const key = Buffer.from(bits.match(/.{8}/g)?.map((byte) => parseInt(byte, 2)) ?? []);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)));
  const mac = createHmac("sha1", key).update(counter).digest();
  const offset = (mac[mac.length - 1] ?? 0) & 15;
  const code = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(code).padStart(6, "0");
}

export async function signIn(
  page: Page,
  user: { email: string; password: string },
  path = "/panel/giris",
) {
  await page.goto(path);
  await page.getByLabel("E-posta").fill(user.email);
  await page.getByLabel("Parola", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
}

/**
 * Every test signs in from its own client address: the sign-in limits (P-09) count per IP, and
 * locally every request comes from the same one. Off Vercel the server reads x-real-ip
 * (src/server/request.ts); on Vercel the platform's own header wins.
 */
export async function ownClientAddress(page: Page): Promise<void> {
  const part = () => Math.floor(Math.random() * 250) + 1;
  await page.setExtraHTTPHeaders({ "x-real-ip": `10.${part()}.${part()}.${part()}` });
}

/** One tap on a demo account (PLATFORM_DEMO=true locally and on CI). */
export async function signInAsDemo(page: Page, label: string) {
  await page.goto("/panel/giris");
  await page.getByRole("button", { name: label }).click();
  await expect(page).not.toHaveURL(/\/panel\/giris/);
}
