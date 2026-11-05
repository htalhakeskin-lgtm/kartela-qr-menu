"use server";

import { redirect } from "next/navigation";

import { formFields, type FormState } from "@/lib/form-data";
import type { Fail } from "@/lib/result";
import {
  changePassword,
  confirmTwoFactor,
  startTwoFactor,
  turnOffTwoFactor,
  type TwoFactorSetup,
} from "@/server/panel/account";

/** Form actions of "Hesabım" (src/server/panel/account.ts validates, authorizes and audits). */

const failure = (result: Fail): NonNullable<FormState> => ({
  message: result.code === "validation" ? null : result.message,
  fieldErrors: result.fieldErrors,
});

export type SetupState = (NonNullable<FormState> & { setup?: TwoFactorSetup }) | null;

export async function startTwoFactorAction(_: SetupState, formData: FormData): Promise<SetupState> {
  const result = await startTwoFactor(formFields(formData));
  if (!result.ok) return failure(result);
  return { message: null, setup: result.data };
}

export async function confirmTwoFactorAction(_: FormState, formData: FormData): Promise<FormState> {
  const result = await confirmTwoFactor(formFields(formData));
  if (!result.ok) return failure(result);
  redirect("/panel/hesap?iki-adim=acildi");
}

export async function turnOffTwoFactorAction(_: FormState, formData: FormData): Promise<FormState> {
  const result = await turnOffTwoFactor(formFields(formData));
  if (!result.ok) return failure(result);
  redirect("/panel/hesap?iki-adim=kapandi");
}

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const result = await changePassword(formFields(formData));
  if (!result.ok) return failure(result);
  redirect("/panel/hesap?parola=degisti");
}
