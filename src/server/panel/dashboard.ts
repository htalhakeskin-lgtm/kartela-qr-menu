import "server-only";

import { availabilityStatus } from "@/platform/menu/availability";
import type { InfoGap } from "@/platform/menu/completeness";
import { orderMenus } from "@/platform/menu/schedule";
import { getVenueView } from "@/server/menu/venue-view";

/**
 * Today's work for a venue's dashboard (SCR-102, 13-yonetim-paneli §4: pending work first):
 * which menu is open and until when, what is sold out, which products lack ingredients or energy
 * (BR-YSL-005). Read from the venue's cached menu view — the same data its visitors get, updated
 * by every panel write (REQ-016) — and evaluated at this request's time.
 */
export type DashboardMenu = { name: string; until: string | null; startsAt: string | null };
export type DashboardSoldOut = { id: string; name: string; until: string | null; byCount: boolean };
export type DashboardGap = { id: string; name: string; gaps: InfoGap[] };

export type Dashboard = {
  open: DashboardMenu[];
  later: DashboardMenu[];
  soldOut: DashboardSoldOut[];
  gaps: DashboardGap[];
  itemCount: number;
};

export async function venueDashboard(slug: string, now: Date): Promise<Dashboard | null> {
  const view = await getVenueView(slug, "tr");
  if (!view) return null;

  const open: DashboardMenu[] = [];
  const later: DashboardMenu[] = [];
  for (const { menu, status } of orderMenus(view.menus, now, view.timeZone)) {
    if (status.state === "open")
      open.push({ name: menu.name.text, until: status.until ?? null, startsAt: null });
    else if (status.state === "later" && status.inDays === 0) {
      later.push({ name: menu.name.text, until: null, startsAt: status.startsAt });
    }
  }

  const soldOut: DashboardSoldOut[] = [];
  const gaps: DashboardGap[] = [];
  for (const item of view.items) {
    const status = availabilityStatus(item.availability, now, view.timeZone);
    if (status.soldOut) {
      soldOut.push({
        id: item.id,
        name: item.name.text,
        until: status.soldOut.reason === "marked" ? status.soldOut.until : null,
        byCount: status.soldOut.reason === "count",
      });
    }
    if (item.infoGaps.length > 0)
      gaps.push({ id: item.id, name: item.name.text, gaps: item.infoGaps });
  }

  return { open, later, soldOut, gaps, itemCount: view.items.length };
}
