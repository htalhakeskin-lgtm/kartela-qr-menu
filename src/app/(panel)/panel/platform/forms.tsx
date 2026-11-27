"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { Field, FormAlert } from "@/components/panel/ui";

import {
  addDomainAction,
  adminRoleAction,
  modeAction,
  type PlatformState,
  redeployAction,
  removeDomainAction,
  verifyDomainAction,
} from "./actions";

/** Platform admin forms (SCR-131, SCR-132). Each shows its own result. */
function Result({ state }: { state: PlatformState }) {
  return (
    <>
      <FormAlert message={state?.message} />
      {state?.done ? (
        <p role="status" className="rounded-md bg-surface-muted px-3 py-2.5 text-sm">
          {state.done}
        </p>
      ) : null}
    </>
  );
}

export function ModeForm({ slug, mode }: { slug: string; mode: "demo" | "live" }) {
  const [state, action] = useActionState(modeAction, null);
  const next = mode === "demo" ? "live" : "demo";
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="mekan" value={slug} />
      <input type="hidden" name="mode" value={next} />
      <SubmitButton pending="Değiştiriliyor…" variant="secondary" className="self-start">
        {next === "live" ? "Canlıya al" : "Demoya al"}
      </SubmitButton>
      <Result state={state} />
    </form>
  );
}

export function AddDomainForm({ slug }: { slug: string }) {
  const [state, action] = useActionState(addDomainAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="mekan" value={slug} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field
          label="Yeni alan adı"
          name="host"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="menu.ornek.com.tr"
          maxLength={253}
          required
          defaultValue={state?.done ? "" : state?.values?.host}
          key={state?.done ?? "alan"}
          error={state?.fieldErrors?.host}
        />
        <SubmitButton pending="Ekleniyor…">Alan adı ekle</SubmitButton>
      </div>
      <Result state={state} />
    </form>
  );
}

export function DomainActions({
  slug,
  domainId,
  host,
  canVerify,
  canRemove,
}: {
  slug: string;
  domainId: string;
  host: string;
  canVerify: boolean;
  canRemove: boolean;
}) {
  const [verifyState, verify] = useActionState(verifyDomainAction, null);
  const [removeState, remove] = useActionState(removeDomainAction, null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {canVerify ? (
          <form action={verify}>
            <input type="hidden" name="mekan" value={slug} />
            <input type="hidden" name="domainId" value={domainId} />
            <SubmitButton pending="Doğrulanıyor…" variant="secondary">
              Doğrula<span className="sr-only">: {host}</span>
            </SubmitButton>
          </form>
        ) : null}
        {canRemove ? (
          <form
            action={remove}
            onSubmit={(event) => {
              if (!window.confirm(`${host} kaldırılsın mı?`)) event.preventDefault();
            }}
          >
            <input type="hidden" name="mekan" value={slug} />
            <input type="hidden" name="domainId" value={domainId} />
            <SubmitButton pending="Kaldırılıyor…" variant="danger">
              Kaldır<span className="sr-only">: {host}</span>
            </SubmitButton>
          </form>
        ) : null}
      </div>
      <Result state={verifyState} />
      <Result state={removeState} />
    </div>
  );
}

export function RedeployForm() {
  const [state, action] = useActionState(redeployAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <SubmitButton pending="Başlatılıyor…" className="self-start">
        Yeniden yayınla
      </SubmitButton>
      <Result state={state} />
    </form>
  );
}

export function AdminRoleForm({
  userId,
  name,
  admin,
}: {
  userId: string;
  name: string;
  admin: boolean;
}) {
  const [state, action] = useActionState(adminRoleAction, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="admin" value={admin ? "hayir" : "evet"} />
      <SubmitButton pending="Değiştiriliyor…" variant="secondary" className="self-start">
        {admin ? "Platform yöneticiliğini al" : "Platform yöneticisi yap"}
        <span className="sr-only">: {name}</span>
      </SubmitButton>
      <Result state={state} />
    </form>
  );
}
