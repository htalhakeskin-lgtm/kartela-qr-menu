"use server";

import { revalidatePath } from "next/cache";

import { formFields, type FormState } from "@/lib/form-data";
import type { Fail } from "@/lib/result";
import {
  cancelInvitation,
  changeMemberRole,
  inviteMember,
  removeMember,
  sendInvitation,
} from "@/server/panel/team";

/**
 * SCR-118 form actions; src/server/panel/team.ts validates, authorizes and audits. The invitation
 * e-mail goes out after the invitation is saved, outside the database transaction.
 */
export type TeamState = (NonNullable<FormState> & { done?: string }) | null;

const failure = (result: Fail, values?: Record<string, string>): TeamState => ({
  message: result.code === "validation" ? null : result.message,
  fieldErrors: result.fieldErrors,
  values,
});

export async function inviteAction(_: TeamState, formData: FormData): Promise<TeamState> {
  const fields = formFields<Record<string, string>>(formData);
  const result = await inviteMember(fields as never);
  if (!result.ok) return failure(result, fields);
  await sendInvitation(result.data);
  revalidatePath("/panel/[mekan]/ekip", "page");
  return { message: null, done: `Davet ${result.data.to} adresine gönderildi.` };
}

export async function changeRoleAction(_: TeamState, formData: FormData): Promise<TeamState> {
  const result = await changeMemberRole(formFields(formData));
  if (!result.ok) return failure(result);
  revalidatePath("/panel/[mekan]/ekip", "page");
  return { message: null, done: "Rol değiştirildi; kişinin oturumları kapatıldı." };
}

export async function removeAction(_: TeamState, formData: FormData): Promise<TeamState> {
  const result = await removeMember(formFields(formData));
  if (!result.ok) return failure(result);
  revalidatePath("/panel/[mekan]/ekip", "page");
  return { message: null, done: "Kişi ekipten çıkarıldı." };
}

export async function cancelInvitationAction(_: TeamState, formData: FormData): Promise<TeamState> {
  const result = await cancelInvitation(formFields(formData));
  if (!result.ok) return failure(result);
  revalidatePath("/panel/[mekan]/ekip", "page");
  return { message: null, done: "Davet geri alındı." };
}
