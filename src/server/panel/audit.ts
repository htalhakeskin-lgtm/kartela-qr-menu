import "server-only";

import { ROLE_LABELS, type VenueRole } from "@/config/permissions";
import { listAudit, withVenue } from "@/server/db/tenant";

import { userDirectory } from "./users";

/**
 * The venue's audit log (SCR-119, owner; 13-yonetim-paneli §10): who, when, what, old → new.
 * Newest first, 50 at a time, filtered by group. Platform-level events (sign-ins) have no venue
 * and are not listed here.
 */
export const AUDIT_PAGE = 50;

export const AUDIT_GROUPS = [
  { key: "members", label: "Ekip" },
  { key: "settings", label: "Ayarlar" },
  { key: "availability", label: "Müsaitlik" },
] as const;
export type AuditGroup = (typeof AUDIT_GROUPS)[number]["key"];

const ACTIONS: Record<string, string> = {
  "members.invited": "ekibe davet etti",
  "members.joined": "ekibe katıldı",
  "members.role_changed": "rol değiştirdi",
  "members.removed": "ekipten çıkardı",
  "members.invitation_revoked": "daveti geri aldı",
  "settings.updated": "mekân bilgilerini güncelledi",
};

const FIELDS: Record<string, string> = {
  role: "Rol",
  email: "E-posta",
  contact: "İletişim",
  hours: "Çalışma saatleri",
  seo: "Açıklama",
  legal: "Alerjen beyanı",
  wifi: "Wi-Fi",
};

export type AuditEntryView = {
  id: string;
  at: Date;
  actor: string;
  action: string;
  subject: string | null;
  changes: { field: string; from: string | null; to: string | null }[];
};

function show(field: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (field === "role" && typeof value === "string" && value in ROLE_LABELS) {
    return ROLE_LABELS[value as VenueRole];
  }
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "değişti"; // a structured value (hours, contact): the field name says what changed
}

export async function auditView(
  venueId: string,
  options: { before?: Date; group?: AuditGroup },
): Promise<AuditEntryView[]> {
  const rows = await withVenue(venueId, (tx) =>
    listAudit(tx, { limit: AUDIT_PAGE, before: options.before, actionPrefix: options.group }),
  );
  const people = await userDirectory(
    rows
      .flatMap((row) => [row.actorId, row.entity === "venue_member" ? row.entityId : null])
      .filter((id): id is string => Boolean(id)),
  );
  return rows.map((row) => ({
    id: row.id,
    at: row.createdAt,
    actor: row.actorId ? (people.get(row.actorId)?.name ?? "Silinmiş kullanıcı") : "Sistem",
    action: ACTIONS[row.action] ?? row.action,
    subject:
      row.entity === "venue_member" && row.entityId
        ? (people.get(row.entityId)?.name ?? null)
        : null,
    changes: Object.entries(row.changes ?? {}).map(([field, change]) => ({
      field: FIELDS[field] ?? field,
      from: show(field, change.from),
      to: show(field, change.to),
    })),
  }));
}
