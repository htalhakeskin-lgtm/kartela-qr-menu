import "server-only";

import { z } from "zod";

import { formatPhone } from "@/lib/format";
import { toE164TR } from "@/lib/phone";
import { fail, type FieldErrors, ok } from "@/lib/result";
import type { Translated } from "@/platform/i18n/fallback";
import { type Locale, LOCALES } from "@/platform/tenant/locales";
import { venueAction } from "@/server/action";
import {
  loadSettings,
  recordAudit,
  saveSettings,
  type VenueSettingsRow,
  withVenue,
} from "@/server/db/tenant";
import { hashIp } from "@/server/request";

/**
 * Venue settings (SCR-117, owner): what the venue's information page shows (D-11) — description,
 * address and map, phone, WhatsApp, e-mail, opening hours, Wi-Fi — and the allergen statement
 * (legal note). Saved with the row's version (a concurrent edit is refused, not overwritten),
 * written to the audit log as old → new, and only this venue's pages are refreshed (REQ-016).
 * Languages need a deploy (the host map is built from the registry, ADR-0002) and stay with the
 * platform admin.
 */
export const WEEKDAYS = [
  [1, "Pazartesi"],
  [2, "Salı"],
  [3, "Çarşamba"],
  [4, "Perşembe"],
  [5, "Cuma"],
  [6, "Cumartesi"],
  [7, "Pazar"],
] as const;

export type SettingsForm = {
  version: number;
  locales: Locale[];
  fields: Record<string, string>;
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The stored row as the form's flat field values. */
export function settingsFields(
  row: VenueSettingsRow,
  locales: readonly Locale[],
): Record<string, string> {
  const fields: Record<string, string> = {
    adres: row.contact.address ?? "",
    harita: row.contact.mapUrl ?? "",
    telefon: row.contact.phone ? formatPhone(row.contact.phone) : "",
    whatsapp: row.contact.whatsapp ? formatPhone(row.contact.whatsapp) : "",
    eposta: row.contact.email ?? "",
    wifiAg: row.wifi?.network ?? "",
    wifiParola: row.wifi?.password ?? "",
  };
  for (const locale of locales) {
    fields[`aciklama_${locale}`] = row.seo.description?.[locale] ?? "";
    fields[`alerjen_${locale}`] = row.legal.allergenStatement?.[locale] ?? "";
  }
  for (const [day] of WEEKDAYS) {
    const range = row.hours[day]?.[0];
    fields[`gun${String(day)}Acilis`] = range?.open ?? "";
    fields[`gun${String(day)}Kapanis`] = range?.close ?? "";
    if (!range) fields[`gun${String(day)}Kapali`] = "on";
  }
  return fields;
}

export async function settingsForm(
  venueId: string,
  locales: readonly Locale[],
): Promise<SettingsForm | null> {
  const row = await withVenue(venueId, (tx) => loadSettings(tx, venueId));
  if (!row) return null;
  return { version: row.version, locales: [...locales], fields: settingsFields(row, locales) };
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `En çok ${String(max)} karakter.`)
    .default("");

/** The form's text fields (names depend on the platform's languages and the weekdays). */
const fieldsSchema = z.object({
  adres: text(200),
  harita: text(500),
  telefon: text(30),
  whatsapp: text(30),
  eposta: text(254),
  wifiAg: text(64),
  wifiParola: text(64),
  ...Object.fromEntries(
    LOCALES.flatMap((locale) => [
      [`aciklama_${locale}`, text(400)],
      [`alerjen_${locale}`, text(600)],
    ]),
  ),
  ...Object.fromEntries(
    WEEKDAYS.flatMap(([day]) => [
      [`gun${String(day)}Acilis`, text(5)],
      [`gun${String(day)}Kapanis`, text(5)],
      [`gun${String(day)}Kapali`, z.literal("on").optional()],
    ]),
  ),
});

const schema = z.object({ venueId: z.uuid(), surum: z.coerce.number().int().min(1) }).loose();

type Fields = Record<string, string | undefined>;

function translated(input: Fields, prefix: string, errors: FieldErrors): Translated | undefined {
  const values = Object.fromEntries(
    LOCALES.flatMap((locale) => {
      const value = input[`${prefix}_${locale}`];
      return value ? [[locale, value]] : [];
    }),
  );
  if (Object.keys(values).length === 0) return undefined;
  if (!values.tr) {
    errors[`${prefix}_tr`] = ["Türkçe metin zorunlu; diğer diller ona eklenir."];
    return undefined;
  }
  return values as Translated;
}

/** Parses the form into the stored shape; field errors name the form's inputs. */
export function parseSettings(raw: unknown): {
  values: Pick<VenueSettingsRow, "contact" | "hours" | "seo" | "legal" | "wifi">;
  errors: FieldErrors;
} {
  const parsed = fieldsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { contact: {}, hours: {}, seo: {}, legal: {}, wifi: null },
      errors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const input = parsed.data as Fields;
  const errors: FieldErrors = {};
  const phone = (name: "telefon" | "whatsapp") => {
    const value = input[name];
    if (!value) return undefined;
    const e164 = toE164TR(value);
    if (!e164) errors[name] = ["Telefon numarasını 0532 123 45 67 biçiminde girin."];
    return e164 ?? undefined;
  };
  const telefon = phone("telefon");
  const whatsapp = phone("whatsapp");
  const eposta = input.eposta?.toLowerCase();
  if (eposta && !z.email().safeParse(eposta).success) {
    errors.eposta = ["Geçerli bir e-posta adresi girin."];
  }
  if (input.harita && !/^https:\/\/\S+$/.test(input.harita)) {
    errors.harita = ["Harita bağlantısı https:// ile başlamalı."];
  }

  const hours: VenueSettingsRow["hours"] = {};
  for (const [day] of WEEKDAYS) {
    if (input[`gun${String(day)}Kapali`] === "on") continue;
    const open = input[`gun${String(day)}Acilis`] ?? "";
    const close = input[`gun${String(day)}Kapanis`] ?? "";
    if (!TIME.test(open) || !TIME.test(close)) {
      errors[`gun${String(day)}Acilis`] = [
        "Açılış ve kapanış saatini girin ya da günü kapalı işaretleyin.",
      ];
      continue;
    }
    hours[day] = [{ open, close }];
  }

  const description = translated(input, "aciklama", errors);
  const allergenStatement = translated(input, "alerjen", errors);
  return {
    values: {
      contact: {
        ...(input.adres ? { address: input.adres } : {}),
        ...(input.harita ? { mapUrl: input.harita } : {}),
        ...(telefon ? { phone: telefon } : {}),
        ...(whatsapp ? { whatsapp } : {}),
        ...(eposta ? { email: eposta } : {}),
      },
      hours,
      seo: description ? { description } : {},
      legal: allergenStatement ? { allergenStatement } : {},
      wifi: input.wifiAg ? { network: input.wifiAg, password: input.wifiParola || null } : null,
    },
    errors,
  };
}

const LABELS: Record<string, string> = {
  contact: "iletişim",
  hours: "çalışma saatleri",
  seo: "açıklama",
  legal: "alerjen beyanı",
  wifi: "Wi-Fi",
};

export const saveVenueSettings = venueAction({
  permission: "settings.edit",
  refresh: ["menu"],
  schema,
  handler: async (input, ctx) => {
    const current = await loadSettings(ctx.tx, ctx.venueId);
    if (!current) return fail("notFound");
    if (current.version !== input.surum) return fail("conflict");

    const { values, errors } = parseSettings(input);
    if (Object.keys(errors).length > 0) return fail("validation", { fieldErrors: errors });

    const legal = { ...current.legal, allergenStatement: values.legal.allergenStatement };
    if (!values.legal.allergenStatement) delete legal.allergenStatement;
    // The form holds every contact field: a cleared field is removed, not kept from the old row.
    const next = { ...values, legal };
    if (!(await saveSettings(ctx.tx, ctx.venueId, current.version, next))) return fail("conflict");

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of Object.keys(LABELS) as (keyof typeof next)[]) {
      if (JSON.stringify(current[key]) !== JSON.stringify(next[key])) {
        changes[key] = { from: current[key], to: next[key] };
      }
    }
    if (Object.keys(changes).length > 0) {
      await recordAudit(ctx.tx, {
        venueId: ctx.venueId,
        actorId: ctx.session.user.id,
        action: "settings.updated",
        entity: "venue_settings",
        entityId: ctx.venueId,
        changes,
        ipHash: hashIp(ctx.ip),
      });
    }
    return ok({ changed: Object.keys(changes).map((key) => LABELS[key] ?? key) });
  },
});
