import type { ReactNode } from "react";

import { PanelShell } from "@/components/panel/shell";
import { currentPanelVenues, requirePanelVenue } from "@/server/panel/session";

/**
 * A venue's panel pages (SCR-102…119): the shell with the venue's navigation for this role. A
 * venue the user does not belong to answers 404, whether or not it exists (BR-KRC-003).
 */
export default async function VenuePanelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ mekan: string }>;
}) {
  const { mekan } = await params;
  const { user, venue } = await requirePanelVenue(mekan);
  const venues = await currentPanelVenues();
  return (
    <PanelShell user={user} venue={venue} venues={venues}>
      {children}
    </PanelShell>
  );
}
