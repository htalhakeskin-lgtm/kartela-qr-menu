"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { Field, FormAlert } from "@/components/panel/ui";

import { demoSignInAction, signInAction } from "./actions";

/** SCR-100 e-mail + password form; keeps the e-mail after a failed attempt, never the password. */
export function SignInForm({ donus }: { donus: string | undefined }) {
  const [state, action] = useActionState(signInAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert message={state?.message} />
      {donus ? <input type="hidden" name="donus" value={donus} /> : null}
      <Field
        label="E-posta"
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        required
        maxLength={254}
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email}
      />
      <Field
        label="Parola"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={128}
        error={state?.fieldErrors?.password}
      />
      <SubmitButton pending="Giriş yapılıyor…" className="mt-2 w-full">
        Giriş yap
      </SubmitButton>
    </form>
  );
}

/** One tap per demo role (plan §19); the password never reaches the browser. */
export function DemoSignIn({ choices }: { choices: { key: string; label: string }[] }) {
  const [state, action] = useActionState(demoSignInAction, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <FormAlert message={state?.message} />
      {choices.map((choice) => (
        <SubmitButton
          key={choice.key}
          name="hesap"
          value={choice.key}
          variant="secondary"
          pending="Giriş yapılıyor…"
          className="w-full"
        >
          <span>{choice.label}</span>
          <span aria-hidden="true">→</span>
        </SubmitButton>
      ))}
    </form>
  );
}
