/**
 * Where to go after signing in (11-guvenlik §7): only a relative panel path. A full URL, a
 * protocol-relative "//host" or a backslash trick would make the login page an open redirect.
 */
export const PANEL_HOME = "/panel";

export function safeReturnPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 512) return PANEL_HOME;
  if (!/^\/panel(?:[/?#]|$)/.test(value)) return PANEL_HOME;
  if (/[\\\s]|\/\/|%2f|%5c/i.test(value)) return PANEL_HOME;
  if (value.startsWith("/panel/giris")) return PANEL_HOME; // never back to the login itself
  return value;
}
