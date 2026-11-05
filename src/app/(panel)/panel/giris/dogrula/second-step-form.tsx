"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { Field, FormAlert } from "@/components/panel/ui";

import { secondStepAction } from "../actions";

/** SCR-101: the authenticator code, or a one-time backup code when the phone is not at hand. */
export function SecondStepForm({
  method,
  donus,
}: {
  method: "totp" | "yedek";
  donus: string | undefined;
}) {
  const [state, action] = useActionState(secondStepAction, null);
  const totp = method === "totp";
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert message={state?.message} />
      <input type="hidden" name="yontem" value={method} />
      {donus ? <input type="hidden" name="donus" value={donus} /> : null}
      <Field
        label={totp ? "Doğrulama kodu" : "Yedek kod"}
        name="kod"
        type="text"
        required
        autoComplete={totp ? "one-time-code" : "off"}
        inputMode={totp ? "numeric" : "text"}
        maxLength={totp ? 7 : 32}
        spellCheck={false}
        hint={
          totp
            ? "Kimlik doğrulama uygulamanızdaki 6 haneli kod."
            : "İki adımlı doğrulamayı açarken kaydettiğiniz kodlardan biri; her kod bir kez geçer."
        }
        error={state?.fieldErrors?.kod}
      />
      {totp ? (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="hatirla" className="size-5 accent-primary" />
          Bu cihazda 30 gün sorma
        </label>
      ) : null}
      <SubmitButton
        pending="Doğrulanıyor…"
        variant={totp ? "primary" : "secondary"}
        className="w-full"
      >
        Doğrula
      </SubmitButton>
    </form>
  );
}
