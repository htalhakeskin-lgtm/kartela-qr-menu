"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { Field, FormAlert } from "@/components/panel/ui";

import {
  changePasswordAction,
  confirmTwoFactorAction,
  startTwoFactorAction,
  turnOffTwoFactorAction,
} from "./actions";

/**
 * Second-step setup in two steps: the password, then the QR code (or the key typed by hand), the
 * backup codes and the first code from the app. Nothing is on until that code is verified.
 */
export function TwoFactorSetupForm() {
  const [state, start] = useActionState(startTwoFactorAction, null);
  const [confirm, verify] = useActionState(confirmTwoFactorAction, null);

  if (!state?.setup) {
    return (
      <form action={start} className="flex max-w-sm flex-col gap-4">
        <FormAlert message={state?.message} />
        <Field
          label="Parolanız"
          name="parola"
          type="password"
          autoComplete="current-password"
          required
          error={state?.fieldErrors?.parola}
        />
        <SubmitButton pending="Hazırlanıyor…" className="self-start">
          İki adımlı doğrulamayı aç
        </SubmitButton>
      </form>
    );
  }

  const { qr, secret, backupCodes } = state.setup;
  return (
    <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
      {/* A data: URL of an SVG generated on the server; it is not served from anywhere. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- next/image cannot load a data: URL with the custom loader */}
      <img
        src={qr}
        alt="Kimlik doğrulama uygulamasıyla okutulacak QR kodu"
        width={192}
        height={192}
        className="size-48 rounded-md border border-border bg-surface p-2"
      />
      <div className="flex flex-col gap-5">
        <ol className="list-decimal space-y-2 ps-5 text-sm">
          <li>
            Kimlik doğrulama uygulamanızla (Google Authenticator, 1Password …) QR kodunu okutun.
          </li>
          <li>
            Okutamıyorsanız anahtarı elle girin:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono break-all">
              {secret}
            </code>
          </li>
          <li>Aşağıdaki yedek kodları güvenli bir yere kaydedin; her biri bir kez geçer.</li>
        </ol>
        <ul
          aria-label="Yedek kodlar"
          className="grid grid-cols-2 gap-2 rounded-md bg-surface-muted p-3 font-mono text-sm tabular-nums sm:grid-cols-3"
        >
          {backupCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <form action={verify} className="flex max-w-sm flex-col gap-4">
          <FormAlert message={confirm?.message} />
          <Field
            label="Uygulamadaki kod"
            name="kod"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            required
            error={confirm?.fieldErrors?.kod}
          />
          <SubmitButton pending="Doğrulanıyor…" className="self-start">
            Doğrula ve aç
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

export function TwoFactorOffForm() {
  const [state, action] = useActionState(turnOffTwoFactorAction, null);
  return (
    <details className="max-w-sm">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
        İki adımlı doğrulamayı kapat
      </summary>
      <form action={action} className="mt-3 flex flex-col gap-4">
        <FormAlert message={state?.message} />
        <Field
          label="Parolanız"
          name="parola"
          type="password"
          autoComplete="current-password"
          required
          error={state?.fieldErrors?.parola}
        />
        <SubmitButton pending="Kapatılıyor…" variant="danger" className="self-start">
          Kapat
        </SubmitButton>
      </form>
    </details>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="flex max-w-sm flex-col gap-4">
      <FormAlert message={state?.message} />
      <Field
        label="Mevcut parola"
        name="mevcut"
        type="password"
        autoComplete="current-password"
        required
        error={state?.fieldErrors?.mevcut}
      />
      <Field
        label="Yeni parola"
        name="yeni"
        type="password"
        autoComplete="new-password"
        required
        minLength={15}
        maxLength={128}
        hint="En az 15 karakter. Bir cümle ya da birkaç kelime de olur."
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
      <SubmitButton pending="Kaydediliyor…" className="self-start">
        Parolayı değiştir
      </SubmitButton>
    </form>
  );
}
