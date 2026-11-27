"use server";

import { revalidatePath } from "next/cache";

import { formFields, type FormState } from "@/lib/form-data";
import type { Fail } from "@/lib/result";
import { setPlatformAdmin } from "@/server/platform/users";
import {
  addVenueDomain,
  redeployPlatform,
  removeVenueDomain,
  setVenueMode,
  verifyVenueDomain,
} from "@/server/platform/venues";

/** SCR-130…132 form actions; src/server/platform/ validates, authorizes and audits. */
export type PlatformState = (NonNullable<FormState> & { done?: string }) | null;

const failure = (result: Fail, values?: Record<string, string>): PlatformState => ({
  message: result.code === "validation" ? null : result.message,
  fieldErrors: result.fieldErrors,
  values,
});

const refresh = () => {
  revalidatePath("/panel/platform", "layout");
};

export async function modeAction(_: PlatformState, formData: FormData): Promise<PlatformState> {
  const result = await setVenueMode(formFields(formData));
  if (!result.ok) return failure(result);
  refresh();
  return {
    message: null,
    done: "Kip değişti. Demo notu hemen; robots.txt ve dizine eklenme yeniden yayından sonra güncellenir.",
  };
}

export async function addDomainAction(
  _: PlatformState,
  formData: FormData,
): Promise<PlatformState> {
  const fields = formFields<Record<string, string>>(formData);
  const result = await addVenueDomain(fields as never);
  if (!result.ok) return failure(result, fields);
  refresh();
  return {
    message: null,
    done: result.data.verified
      ? "Alan adı Vercel'de doğrulandı. Yayına girmesi için yeniden yayınlayın."
      : 'Alan adı eklendi. DNS kaydını tamamlayıp "Doğrula" ile onaylayın.',
  };
}

export async function verifyDomainAction(
  _: PlatformState,
  formData: FormData,
): Promise<PlatformState> {
  const result = await verifyVenueDomain(formFields(formData));
  if (!result.ok) return failure(result);
  refresh();
  return { message: null, done: "Alan adı etkin. Yayına girmesi için yeniden yayınlayın." };
}

export async function removeDomainAction(
  _: PlatformState,
  formData: FormData,
): Promise<PlatformState> {
  const result = await removeVenueDomain(formFields(formData));
  if (!result.ok) return failure(result);
  refresh();
  return { message: null, done: "Alan adı kaldırıldı." };
}

export async function redeployAction(_: PlatformState, formData: FormData): Promise<PlatformState> {
  const result = await redeployPlatform(formFields(formData));
  if (!result.ok) return failure(result);
  return { message: null, done: "Yeniden yayın başladı; birkaç dakika içinde yayında olur." };
}

export async function adminRoleAction(
  _: PlatformState,
  formData: FormData,
): Promise<PlatformState> {
  const result = await setPlatformAdmin(formFields(formData));
  if (!result.ok) return failure(result);
  refresh();
  return { message: null, done: "Platform rolü değişti; kişinin oturumları kapatıldı." };
}
