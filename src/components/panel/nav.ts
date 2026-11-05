import { hasVenuePermission, type VenuePermission, type VenueRole } from "@/config/permissions";

import type { PanelIconName } from "./icons";

/**
 * The panel's venue pages, grouped (13-yonetim-paneli §3, AP-06: side menu only). A page enters
 * here in the slice that builds it — never a link to a page that does not exist yet:
 * D-18b settings, team, audit log · D-20 availability, menu of the day · D-23… content.
 * The role only hides what it cannot use; every page and action checks again on the server.
 */
export type PanelNavItem = {
  label: string;
  path: string;
  icon: PanelIconName;
  /** The dashboard's path is the prefix of every venue page. */
  exact?: boolean;
  permission?: VenuePermission;
  /** Shown in the phone's tab bar (at most three; "Hesabım" and "Daha fazla" follow). */
  tab?: boolean;
};

export type PanelNavGroup = { label: string; items: PanelNavItem[] };

export function venueNav(slug: string, role: VenueRole | "platform"): PanelNavGroup[] {
  const base = `/panel/${slug}`;
  const groups: PanelNavGroup[] = [
    {
      label: "Bugün",
      items: [{ label: "Pano", path: base, icon: "pano", exact: true, tab: true }],
    },
  ];
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          !item.permission || role === "platform" || hasVenuePermission(role, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
