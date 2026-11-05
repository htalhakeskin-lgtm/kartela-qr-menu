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

/** Panel labels (plan §3); "platform" is a platform admin acting without a membership. */
export const ROLE_LABELS: Record<VenueRole | "platform", string> = {
  owner: "Sahip",
  manager: "Yönetici",
  staff: "Personel",
  platform: "Platform yöneticisi",
};

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

/**
 * BR-YTK-002: on the live platform (PLATFORM_DEMO=false) a platform admin and a venue owner must
 * use a second step (TOTP) before the panel lets them work. The demo platform's accounts are
 * exempt — they are shared and cannot set one up.
 */
export function secondStepRequired(
  user: { platformAdmin: boolean; ownsVenue: boolean },
  livePlatform: boolean,
): boolean {
  return livePlatform && (user.platformAdmin || user.ownsVenue);
}
