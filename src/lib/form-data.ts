/**
 * A form submission as plain fields for a server action wrapper, which validates it with Zod
 * (05-sunucu-ve-api §5). Files are dropped; a repeated name keeps its last value.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T is the wrapped action's input type, inferred at the call site; the wrapper validates it with Zod
export function formFields<T>(formData: FormData): T {
  const fields: Record<string, string> = {};
  for (const [name, value] of formData.entries()) {
    if (typeof value === "string" && !name.startsWith("$ACTION")) fields[name] = value;
  }
  return fields as T;
}

/**
 * State a panel form keeps between submissions: the failure to show and the values to put back
 * (a failed submission never loses what was typed; passwords are never echoed).
 */
export type FormState = {
  message: string | null;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
} | null;

export function keepValues(formData: FormData, names: readonly string[]): Record<string, string> {
  return Object.fromEntries(
    names.flatMap((name) => {
      const value = formData.get(name);
      return typeof value === "string" ? [[name, value]] : [];
    }),
  );
}
