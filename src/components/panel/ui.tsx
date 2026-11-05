import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * The panel's small form kit (06-arayuz, 13-yonetim-paneli; plan §11.8): native elements styled
 * with Kartela's tokens. Server-safe; the only client piece is SubmitButton (pending state).
 * Inputs are 16 px (no iOS zoom), every control is at least 44 px tall, errors are announced
 * through aria-describedby.
 */
type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const BUTTON = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-control-border bg-surface text-foreground hover:border-foreground",
  quiet: "text-foreground underline-offset-4 hover:underline",
  danger: "border border-danger bg-surface text-danger hover:bg-danger hover:text-surface",
} as const satisfies Record<ButtonVariant, string>;

export function buttonClass(variant: ButtonVariant = "primary", extra = ""): string {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[0.9375rem] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON[variant]} ${extra}`;
}

type FieldProps = {
  label: string;
  name: string;
  error?: string[] | undefined;
  hint?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id" | "className">;

export function Field({ label, name, error, hint, ...input }: FieldProps) {
  const id = `alan-${name}`;
  const describedBy = [hint ? `${id}-ipucu` : null, error?.length ? `${id}-hata` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="min-h-11 w-full rounded-md border border-control-border bg-surface px-3 text-base text-foreground placeholder:text-muted-foreground aria-invalid:border-danger"
        {...input}
      />
      {hint ? (
        <p id={`${id}-ipucu`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error?.length ? (
        <p id={`${id}-hata`} className="text-sm text-danger">
          {error[0]}
        </p>
      ) : null}
    </div>
  );
}

/** A failed action's message above the form; role="alert" so it is read out. */
export function FormAlert({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2.5 text-sm text-danger"
    >
      {message}
    </p>
  );
}

/** A section card on panel pages (13-yonetim-paneli §4). */
export function PanelCard({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const headingId = id ? `${id}-baslik` : undefined;
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-border bg-surface p-4 md:p-6"
    >
      <h2 id={headingId} className="text-base font-semibold">
        {title}
      </h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
