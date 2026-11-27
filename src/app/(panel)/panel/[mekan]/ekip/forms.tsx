"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { Field, FormAlert } from "@/components/panel/ui";

import {
  cancelInvitationAction,
  changeRoleAction,
  inviteAction,
  removeAction,
  type TeamState,
} from "./actions";

/** SCR-118 forms. Each shows its own result; removal asks for confirmation with the name. */
const ROLE_OPTIONS = [
  { value: "staff", label: "Personel" },
  { value: "manager", label: "Yönetici" },
  { value: "owner", label: "Sahip" },
] as const;

function Done({ state }: { state: TeamState }) {
  if (!state?.done) return null;
  return (
    <p role="status" className="rounded-md bg-surface-muted px-3 py-2.5 text-sm">
      {state.done}
    </p>
  );
}

function RoleSelect({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`alan-${name}`} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={`alan-${name}`}
        name={name}
        defaultValue={defaultValue}
        className="min-h-11 rounded-md border border-control-border bg-surface px-3 text-base"
      >
        {ROLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function InviteForm({ venueId }: { venueId: string }) {
  const [state, action] = useActionState(inviteAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormAlert message={state?.message} />
      <Done state={state} />
      <input type="hidden" name="venueId" value={venueId} />
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <Field
          label="E-posta"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="off"
          required
          maxLength={254}
          defaultValue={state?.done ? "" : state?.values?.email}
          key={state?.done ?? "davet"}
          error={state?.fieldErrors?.email}
        />
        <RoleSelect name="role" label="Rol" defaultValue={state?.values?.role ?? "staff"} />
        <SubmitButton pending="Gönderiliyor…">Davet gönder</SubmitButton>
      </div>
    </form>
  );
}

export function MemberActions({
  venueId,
  memberId,
  name,
  role,
}: {
  venueId: string;
  memberId: string;
  name: string;
  role: string;
}) {
  const [roleState, changeRole] = useActionState(changeRoleAction, null);
  const [removeState, remove] = useActionState(removeAction, null);
  return (
    <details className="w-full">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium">
        Düzenle<span className="sr-only">: {name}</span>
      </summary>
      <div className="mt-3 flex flex-col gap-4 rounded-md bg-surface-muted p-4">
        <form action={changeRole} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="venueId" value={venueId} />
          <input type="hidden" name="memberId" value={memberId} />
          <RoleSelect name="role" label={`${name} için rol`} defaultValue={role} />
          <SubmitButton pending="Kaydediliyor…" variant="secondary">
            Rolü kaydet
          </SubmitButton>
        </form>
        <FormAlert message={roleState?.message} />
        <Done state={roleState} />
        <form
          action={remove}
          onSubmit={(event) => {
            if (!window.confirm(`${name} ekipten çıkarılsın mı?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="venueId" value={venueId} />
          <input type="hidden" name="memberId" value={memberId} />
          <SubmitButton pending="Çıkarılıyor…" variant="danger">
            Ekipten çıkar
          </SubmitButton>
        </form>
        <FormAlert message={removeState?.message} />
        <Done state={removeState} />
      </div>
    </details>
  );
}

export function CancelInvitation({
  venueId,
  invitationId,
  email,
}: {
  venueId: string;
  invitationId: string;
  email: string;
}) {
  const [state, action] = useActionState(cancelInvitationAction, null);
  return (
    <form action={action}>
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="invitationId" value={invitationId} />
      <SubmitButton pending="Geri alınıyor…" variant="secondary">
        Geri al<span className="sr-only">: {email}</span>
      </SubmitButton>
      <FormAlert message={state?.message} />
    </form>
  );
}
