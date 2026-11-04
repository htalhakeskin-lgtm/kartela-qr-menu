import { loadEnvConfig } from "@next/env";

// Same loader as Next.js; with NODE_ENV=test it reads .env.test and skips .env.local.
loadEnvConfig(process.cwd());
