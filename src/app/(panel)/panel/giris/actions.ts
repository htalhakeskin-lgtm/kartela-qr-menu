"use server";

import { redirect } from "next/navigation";

import { formFields, type FormState, keepValues } from "@/lib/form-data";
import { requestPasswordReset, resetPassword } from "@/server/panel/password-reset";
import {
  signInAsDemo,
  signInWithPassword,
  signOut,
  verifySecondStep,
} from "@/server/panel/sign-in";
import { acceptInvitationWithPassword } from "@/server/panel/team";

/**
 * Form actions of the sign-in pages (SCR-100, SCR-101). The wrapped actions in
 * src/server/panel/sign-in.ts validate, limit and audit; these only redirect on success, outside
 * the wrapper (a redirect is thrown and must not be caught as an error).
 */

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const result = await signInWithPassword(formFields(formData));
  if (result.ok) redirect(result.data.to as never);
  return {
    message: result.code === "validation" ? null : result.message,
    fieldErrors: result.fieldErrors,
    values: keepValues(formData, ["email"]),
  };
}

export async function demoSignInAction(_: FormState, formData: FormData): Promise<FormState> {
  const result = await signInAsDemo(formFields(formData));
  if (result.ok) redirect(result.data.to as never);
  return { message: result.message };
}

export async function secondStepAction(_: FormState, formData: FormData): Promise<FormState> {
  const result = await verifySecondStep(formFields(formData));
  if (result.ok) redirect(result.data.to as never);
  if (result.code === "unauthorized") redirect("/panel/giris?sure=doldu");
  return {
    message: result.code === "validation" ? null : result.message,
    fieldErrors: result.fieldErrors,
    values: keepValues(formData, ["yontem"]),
  };
}

export async function signOutAction(): Promise<void> {
  await signOut({});
  redirect("/panel/giris");
}

export async function acceptInvitationAction(_: FormState, formData: FormData): Promise<FormState> {
  const result = await acceptInvitationWithPassword(formFields(formData));
  if (result.ok) redirect(result.data.to as never);
  return {
    message: result.code === "validation" ? null : result.message,
    fieldErrors: result.fieldErrors,
    values: keepValues(formData, ["ad"]),
  };
}

export type ResetRequestState = (NonNullable<FormState> & { sent?: boolean }) | null;

export async function requestResetAction(
  _: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const result = await requestPasswordReset(formFields(formData));
  if (result.ok) return { message: null, sent: true };
  return {
    message: result.code === "validation" ? null : result.message,
    fieldErrors: result.fieldErrors,
    values: keepValues(formData, ["email"]),
  };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const result = await resetPassword(formFields(formData));
  if (result.ok) redirect("/panel/giris?parola=yenilendi");
  return {
    message: result.code === "validation" ? null : result.message,
    fieldErrors: result.fieldErrors,
  };
}
