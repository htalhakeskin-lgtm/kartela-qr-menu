import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { DEMO_VENUE_ACCOUNTS } from "@/config/demo-accounts";
import { isPlatformAdmin, secondStepRequired } from "@/config/permissions";
import { env } from "@/lib/env";
import { getSession } from "@/server/auth";
import { type PanelVenue, panelVenue, panelVenues } from "@/server/db/tenant";

/**
 * The panel's data access layer for the signed-in user (Next.js authentication guide: DAL).
 * Pages and layouts call these; server actions re-check through src/server/action.ts. A session
 * read is request data, so every caller renders behind the panel root layout's <Suspense>.
 */
export const LOGIN_PATH = "/panel/giris";
export const ACCOUNT_PATH = "/panel/hesap";

export type PanelUser = {
  id: string;
  name: string;
  email: string;
  platformAdmin: boolean;
  twoFactorEnabled: boolean;
  /** A shared demo account (config/demo-accounts.ts): no password or second-step changes. */
  demo: boolean;
};

export function isDemoAccount(email: string): boolean {
  if (!env.PLATFORM_DEMO) return false;
  const address = email.toLowerCase();
  return (
    address === env.DEMO_ADMIN_EMAIL?.toLowerCase() ||
    DEMO_VENUE_ACCOUNTS.some((account) => account.email === address)
  );
}

type SessionUser = { platformRole?: string | null; twoFactorEnabled?: boolean | null };

/** The signed-in panel user, once per request; null without a valid session. */
export const currentPanelUser = cache(async (): Promise<PanelUser | null> => {
  const session = await getSession();
  if (!session) return null;
  const extra = session.user as typeof session.user & SessionUser;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    platformAdmin: isPlatformAdmin(extra.platformRole),
    twoFactorEnabled: extra.twoFactorEnabled === true,
    demo: isDemoAccount(session.user.email),
  };
});

/** The venues this user may open, once per request. */
export const currentPanelVenues = cache(async (): Promise<PanelVenue[]> => {
  const user = await currentPanelUser();
  return user ? panelVenues(user.id, user.platformAdmin) : [];
});

/** BR-YTK-002 for this user: is a second step required before working in the panel? */
export async function needsSecondStep(user: PanelUser): Promise<boolean> {
  if (user.twoFactorEnabled) return false;
  const ownsVenue = (await currentPanelVenues()).some((venue) => venue.role === "owner");
  return secondStepRequired({ platformAdmin: user.platformAdmin, ownsVenue }, !env.PLATFORM_DEMO);
}

/**
 * Every panel page except sign-in: no session → sign-in; a required second step not set up yet →
 * the account page, which is the only page that stays open (`allowWithoutSecondStep`).
 */
export async function requirePanelUser(
  options: { allowWithoutSecondStep?: boolean } = {},
): Promise<PanelUser> {
  const user = await currentPanelUser();
  if (!user) redirect(LOGIN_PATH);
  if (!options.allowWithoutSecondStep && (await needsSecondStep(user))) {
    redirect(`${ACCOUNT_PATH}?iki-adim=gerekli`);
  }
  return user;
}

/** One venue lookup per request: the venue layout and its page both ask. */
const venueForUser = cache((slug: string, userId: string, platformAdmin: boolean) =>
  panelVenue(slug, userId, platformAdmin),
);

/**
 * A venue page: the venue and the user's role in it. A venue that does not exist and one the user
 * does not belong to answer the same 404 (BR-KRC-003).
 */
export async function requirePanelVenue(
  slug: string,
): Promise<{ user: PanelUser; venue: PanelVenue }> {
  const user = await requirePanelUser();
  const venue = await venueForUser(slug, user.id, user.platformAdmin);
  if (!venue) notFound();
  return { user, venue };
}
