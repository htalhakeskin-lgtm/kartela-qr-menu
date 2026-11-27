import "server-only";

import { DEMO_VENUE_ACCOUNTS } from "@/config/demo-accounts";
import { env } from "@/lib/env";

/**
 * A shared demo account (config/demo-accounts.ts, plan §19): it signs in with one tap and cannot
 * change its password, its second step or the team (11-guvenlik §4 "Demo"). Only while
 * PLATFORM_DEMO=true; on the live platform no address is a demo account.
 */
export function isDemoAccount(email: string): boolean {
  if (!env.PLATFORM_DEMO) return false;
  const address = email.toLowerCase();
  return (
    address === env.DEMO_ADMIN_EMAIL?.toLowerCase() ||
    DEMO_VENUE_ACCOUNTS.some((account) => account.email === address)
  );
}
