// Platform-level tables, shared by the app's owner connection (src/server/db/client.ts).
// Tenant tables are NOT re-exported here: they live in src/server/db/tenant/tables/ and are
// reached only through withVenue() (ADR-0004). drizzle.config.ts lists both folders.
export * from "./auth"; // generated: pnpm auth:generate
export * from "./core";
export * from "./venues";
