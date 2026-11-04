/**
 * Role → permission matrix (11-guvenlik §5, plan §8, BR-YTK-001). Permission codes are
 * `resource.action`. The panel hides what a role cannot do, but the server is the authority:
 * every venue action declares the permission it needs. A platform admin (users.platform_role)
 * holds every venue permission plus the platform ones.
 */
export const VENUE_PERMISSIONS = [
  "availability.edit", // sold out, daily count, bake times, menu of the day
  "content.edit", // menus, sections, items, options, stories, media, translations
  "prices.edit", // single prices, bulk update, revert
  "contexts.edit", // tables / rooms / zones, QR codes, print-outs, import
  "stats.view",
  "settings.edit", // venue info, hours, languages, legal notes
  "members.manage",
  "audit.view",
] as const;

export const PLATFORM_PERMISSIONS = ["platform.venues", "platform.users"] as const;

export type VenuePermission = (typeof VENUE_PERMISSIONS)[number];
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];
export type Permission = VenuePermission | PlatformPermission;

export const VENUE_ROLES = ["owner", "manager", "staff"] as const;
export type VenueRole = (typeof VENUE_ROLES)[number];

const matrix: Record<VenueRole, readonly VenuePermission[]> = {
  owner: VENUE_PERMISSIONS,
  manager: ["availability.edit", "content.edit", "prices.edit", "contexts.edit", "stats.view"],
  staff: ["availability.edit"],
};

export function hasVenuePermission(
  role: string | null | undefined,
  permission: VenuePermission,
): boolean {
  if (!role || !(VENUE_ROLES as readonly string[]).includes(role)) return false;
  return matrix[role as VenueRole].includes(permission);
}

export function isPlatformAdmin(platformRole: string | null | undefined): boolean {
  return platformRole === "admin";
}
