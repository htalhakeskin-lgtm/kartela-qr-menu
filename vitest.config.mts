import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const alias = {
  "@": fileURLToPath(new URL("./src", import.meta.url)),
  // "server-only" throws outside React Server Components; tests import server modules directly.
  "server-only": fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url)),
};

/** Turkish locale and Istanbul time zone, like production users (14-test). */
const shared = {
  environment: "node" as const,
  env: { TZ: "Europe/Istanbul", LANG: "tr_TR.UTF-8" },
  restoreMocks: true,
  // NODE_ENV=test: loads .env.test (never .env.local) before any module reads the environment.
  setupFiles: ["./tests/setup/env.ts"],
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: { ...shared, name: "unit", include: ["src/**/*.test.{ts,tsx}"] },
      },
      {
        resolve: { alias },
        test: {
          ...shared,
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          // Real PostgreSQL (14-test: the database is never mocked); migrations run once.
          globalSetup: ["./tests/setup/migrate.ts"],
          // One database: files must not clean each other's tables in parallel.
          fileParallelism: false,
        },
      },
    ],
  },
});
