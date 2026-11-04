/**
 * Turkish display formatting. The only place where numbers, money, dates and phone
 * numbers are turned into user-facing text (KURALLAR C, 03-kod §8).
 *
 * Storage conventions: money in minor units (kuruş) as integers, instants as UTC,
 * phones as E.164. Display time zone is always Europe/Istanbul, independent of the
 * browser or server time zone.
 */

export const DISPLAY_TIME_ZONE = "Europe/Istanbul";
const LOCALE = "tr-TR";
/** Non-breaking space: keeps "1.234,56 ₺" and "120 m²" on one line. */
const NBSP = " ";

const CURRENCY_SYMBOLS: Record<string, string> = { TRY: "₺", EUR: "€", USD: "$", GBP: "£" };

export type MoneyFormatOptions = {
  currency?: string;
  /** "always": 1.250,00 ₺ (tables, invoices) · "auto": 1.250 ₺ when there are no kuruş · "never": rounded */
  decimals?: "always" | "auto" | "never";
};

/** 123456 → "1.234,56 ₺" (symbol after the amount, separated by a no-break space). */
export function formatMoney(minor: number, options: MoneyFormatOptions = {}): string {
  if (!Number.isSafeInteger(minor))
    throw new RangeError(`formatMoney expects integer minor units, got ${minor}`);
  const { currency = "TRY", decimals = "always" } = options;
  const hasFraction = minor % 100 !== 0;
  const digits = decimals === "never" || (decimals === "auto" && !hasFraction) ? 0 : 2;
  const amount = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minor / 100);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${amount}${NBSP}${symbol}`;
}

/** 1234.5 → "1.234,5" */
export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value);
}

/** 15 → "%15", 7.5 → "%7,5" (input is 0–100, not a fraction). */
export function formatPercent(value: number, maximumFractionDigits = 1): string {
  const formatted = formatNumber(Math.abs(value), maximumFractionDigits);
  return value < 0 ? `-%${formatted}` : `%${formatted}`;
}

/** 120 → "120 m²" */
export function formatArea(squareMeters: number): string {
  return `${formatNumber(squareMeters, 0)}${NBSP}m²`;
}

type DateInput = Date | string | number;
const toDate = (value: DateInput): Date => (value instanceof Date ? value : new Date(value));

const longDate = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
});
const shortDate = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
});
const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: "long", timeZone: DISPLAY_TIME_ZONE });
const time = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: DISPLAY_TIME_ZONE,
});

/** "15 Ekim 2026" (long, default) · "15.10.2026" (short) · "15 Ekim 2026 Perşembe" (withWeekday) */
export function formatDate(
  value: DateInput,
  style: "long" | "short" | "withWeekday" = "long",
): string {
  const date = toDate(value);
  if (style === "short") return shortDate.format(date);
  if (style === "withWeekday") return `${longDate.format(date)} ${weekday.format(date)}`;
  return longDate.format(date);
}

/** "14:30" */
export function formatTime(value: DateInput): string {
  return time.format(toDate(value));
}

/** "15 Ekim 2026 14:30" */
export function formatDateTime(value: DateInput): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}

const relative = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });
const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.345],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

/** "3 gün önce", "yarın", "2 saat sonra". `now` is a parameter so the output is testable. */
export function formatRelativeTime(value: DateInput, now: Date): string {
  let amount = (toDate(value).getTime() - now.getTime()) / 1000;
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(amount) < size) return relative.format(Math.round(amount), unit);
    amount /= size;
  }
  return relative.format(Math.round(amount), "year");
}

/**
 * "+905321234567" → "0532 123 45 67", "+902121234567" → "0212 123 45 67".
 * Numbers outside Turkey are returned in E.164 form unchanged.
 */
export function formatPhone(e164: string): string {
  const match = /^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  if (!match) return e164;
  const [, area = "", first = "", second = "", third = ""] = match;
  return `0${area} ${first} ${second} ${third}`;
}
