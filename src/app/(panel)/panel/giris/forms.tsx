"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { Field, FormAlert } from "@/components/panel/ui";

import { acceptInvitationAction, requestResetAction, resetPasswordAction } from "./actions";

/** Invitation acceptance and password reset forms (sign-in flow, open without a session). */

const PASSWORD_HINT = "En az 15 karakter. Bir cümle ya da birkaç kelime de olur.";

export function AcceptInvitationForm({
  token,
  hasAccount,
  email,
}: {
  token: string;
  hasAccount: boolean;
  email: string;
}) {
  const [state, action] = useActionState(acceptInvitationAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert message={state?.message} />
      <input type="hidden" name="belirtec" value={token} />
      {/* Lets a password manager save the new password under the right address. */}
      <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />
      {hasAccount ? (
        <Field
          label="Parolanız"
          name="parola"
          type="password"
          autoComplete="current-password"
          required
          error={state?.fieldErrors?.parola}
        />
      ) : (
        <>
          <Field
            label="Adınız ve soyadınız"
            name="ad"
            autoComplete="name"
            required
            maxLength={80}
            defaultValue={state?.values?.ad}
            error={state?.fieldErrors?.ad}
          />
          <Field
            label="Parola"
            name="parola"
            type="password"
            autoComplete="new-password"
            required
            minLength={15}
            maxLength={128}
            hint={PASSWORD_HINT}
            error={state?.fieldErrors?.parola}
          />
          <Field
            label="Parola (tekrar)"
            name="tekrar"
            type="password"
            autoComplete="new-password"
            required
            error={state?.fieldErrors?.tekrar}
          />
        </>
      )}
      <SubmitButton pending="Kabul ediliyor…" className="mt-2 w-full">
        Daveti kabul et
      </SubmitButton>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestResetAction, null);
  if (state?.sent) {
    return (
      <p role="status" className="rounded-md bg-surface-muted px-4 py-3">
        Bu adrese ait bir hesap varsa parola sıfırlama bağlantısı gönderildi. Bağlantı 30 dakika
        geçerlidir.
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert message={state?.message} />
      <Field
        label="E-posta"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        required
        maxLength={254}
        defaultValue={state?.values?.email}
        error={state?.fieldErrors?.email}
      />
      <SubmitButton pending="Gönderiliyor…" className="mt-2 w-full">
        Bağlantı gönder
      </SubmitButton>
    </form>
  );
}

export function NewPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert message={state?.message} />
      <input type="hidden" name="belirtec" value={token} />
      <Field
        label="Yeni parola"
        name="yeni"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        hint={PASSWORD_HINT}
        error={state?.fieldErrors?.yeni}
      />
      <Field
        label="Yeni parola (tekrar)"
        name="tekrar"
        type="password"
        autoComplete="new-password"
        required
        error={state?.fieldErrors?.tekrar}
      />
      <SubmitButton pending="Kaydediliyor…" className="mt-2 w-full">
        Parolayı kaydet
      </SubmitButton>
    </form>
  );
}
