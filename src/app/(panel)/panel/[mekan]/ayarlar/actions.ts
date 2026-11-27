"use server";

import { redirect } from "next/navigation";

import { formFields, type FormState } from "@/lib/form-data";
import { saveVenueSettings } from "@/server/panel/settings";

/** SCR-117 form action; src/server/panel/settings.ts validates, authorizes, saves and audits. */
export async function saveSettingsAction(_: FormState, formData: FormData): Promise<FormState> {
  const fields = formFields<Record<string, string>>(formData);
  const result = await saveVenueSettings(fields as never);
  const slug = fields.mekan ?? "";
  if (result.ok && /^[a-z][a-z0-9-]{1,30}$/.test(slug)) {
    redirect(`/panel/${slug}/ayarlar?kaydedildi=1` as never);
  }
  if (result.ok) return { message: null };
  return {
    message: result.code === "validation" ? "Lütfen işaretli alanları düzeltin." : result.message,
    fieldErrors: result.fieldErrors,
    values: fields,
  };
}
