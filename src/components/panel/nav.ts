import { can, type VenuePermission, type VenueRole } from "@/config/permissions";

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
      items: [
        { label: "Pano", path: base, icon: "pano", exact: true, tab: true },
        {
          label: "Müsaitlik",
          path: `${base}/musaitlik`,
          icon: "musaitlik",
          permission: "availability.edit",
          tab: true,
        },
        {
          label: "Günün menüsü",
          path: `${base}/gunun-menusu`,
          icon: "gunun",
          permission: "availability.edit",
        },
      ],
    },
    {
      label: "Mekân",
      items: [
        { label: "Ayarlar", path: `${base}/ayarlar`, icon: "ayarlar", permission: "settings.edit" },
        { label: "Ekip", path: `${base}/ekip`, icon: "ekip", permission: "members.manage" },
        {
          label: "İşlem geçmişi",
          path: `${base}/gecmis`,
          icon: "gecmis",
          permission: "audit.view",
        },
      ],
    },
  ];
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || can(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

/** The platform admin's pages (SCR-130…132), beside any venue's (D-19). */
export function platformNav(): PanelNavGroup[] {
  return [
    {
      label: "Platform",
      items: [
        { label: "Mekân yönetimi", path: "/panel/platform/mekanlar", icon: "mekanlar" },
        { label: "Kullanıcılar", path: "/panel/platform/kullanicilar", icon: "ekip" },
      ],
    },
  ];
}
