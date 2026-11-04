import { z } from "zod";

/**
 * Configuration that is safe to expose to the browser. Only NEXT_PUBLIC_* variables are
 * inlined by Next.js, and only when referenced literally — hence the explicit object below.
 *
 * NEXT_PUBLIC_PLATFORM_URL is the platform's own address (introduction page + panel). Venue
 * sites never use it: each venue's canonical address comes from its domain record (ADR-0002).
 */
const schema = z.object({
  NEXT_PUBLIC_PLATFORM_URL: z.url(),
});

// PLATFORM_DEMO is deliberately not public: the demo banner and noindex are rendered on the server.
const orUndefined = (value: string | undefined) => (value === "" ? undefined : value);

export const publicEnv = schema.parse({
  // eslint-disable-next-line no-restricted-properties -- literal references are required for inlining
  NEXT_PUBLIC_PLATFORM_URL: orUndefined(process.env.NEXT_PUBLIC_PLATFORM_URL),
});
