import "server-only";

/**
 * Structured JSON logs (11-guvenlik §11). Never log names, e-mails, phones or message bodies:
 * pass ids. Strings that look like e-mails or phone numbers are masked as a safety net.
 */
type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE = /\+?\d[\d\s()-]{8,}\d/g;

function mask(value: unknown): unknown {
  if (typeof value === "string") return value.replace(EMAIL, "[email]").replace(PHONE, "[phone]");
  if (Array.isArray(value)) return value.map(mask);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, mask(inner)]));
  }
  return value;
}

function write(level: Level, msg: string, fields: Fields = {}) {
  const line = JSON.stringify({
    level,
    msg,
    time: new Date().toISOString(),
    ...(mask(fields) as Fields),
  });
  // eslint-disable-next-line no-console -- the logger is the only console writer
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

export const logger = {
  debug: (msg: string, fields?: Fields) => {
    write("debug", msg, fields);
  },
  info: (msg: string, fields?: Fields) => {
    write("info", msg, fields);
  },
  warn: (msg: string, fields?: Fields) => {
    write("warn", msg, fields);
  },
  error: (msg: string, fields?: Fields) => {
    write("error", msg, fields);
  },
};
