import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { PanelShell } from "@/components/panel/shell";
import { currentPanelVenues, requirePanelUser } from "@/server/panel/session";

/**
 * Platform admin pages (SCR-130…132). Anyone else gets the panel's 404: the pages are not
 * announced to other roles (BR-KRC-003 style). Every action checks again (platformAction).
 */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const user = await requirePanelUser();
  if (!user.platformAdmin) notFound();
  const venues = await currentPanelVenues();
  return (
    <PanelShell user={user} venue={null} venues={venues}>
      {children}
    </PanelShell>
  );
}
