import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Same .env files as Next.js (.env.local, .env.development…).
loadEnvConfig(process.cwd());

// Migrations use the direct (unpooled) connection when it exists (16-ortamlar-ve-yayin §3).
// `||` on purpose: an empty value copied from .env.example counts as unset.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
