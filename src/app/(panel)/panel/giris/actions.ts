"use server";

import { redirect } from "next/navigation";

import { formFields, type FormState, keepValues } from "@/lib/form-data";
import {
  signInAsDemo,
  signInWithPassword,
  signOut,
  verifySecondStep,
} from "@/server/panel/sign-in";

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
