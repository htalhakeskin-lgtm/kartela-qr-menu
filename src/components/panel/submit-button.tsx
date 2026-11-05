"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { buttonClass } from "./ui";

/** A form's submit button that shows the pending state while the server action runs. */
export function SubmitButton({
  children,
  pending: pendingLabel,
  variant = "primary",
  className = "",
  name,
  value,
}: {
  children: ReactNode;
  pending: string;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  // With several submit buttons in one form, only the pressed one shows the pending label.
  const mine = pending && (!name || data.get(name) === value);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={buttonClass(variant, className)}
    >
      {mine ? pendingLabel : children}
    </button>
  );
}
