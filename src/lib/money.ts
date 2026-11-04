/**
 * Money input parsing without floating point. Amounts are integers in minor units (kuruş).
 * Use this instead of Number()/parseFloat() for anything typed by a user (03-kod §4).
 */

/**
 * Parses a Turkish or plain amount into kuruş.
 * "1.234,56" → 123456 · "1234,5" → 123450 · "1.250" → 125000 · "12.5" → 1250 · "₺ 99" → 9900
 * Returns null when the text is not a valid amount (more than 2 decimals, letters, empty).
 */
export function parseMoney(input: string, { allowNegative = false } = {}): number | null {
  let text = input.replace(/\s| |₺|TL|TRY/gi, "");
  if (text === "") return null;

  let sign = 1;
  if (text.startsWith("-")) {
    if (!allowNegative) return null;
    sign = -1;
    text = text.slice(1);
  }

  let integerPart: string;
  let fractionPart = "";
  if (text.includes(",")) {
    // Turkish: dots are thousand separators, comma is the decimal separator.
    const [whole = "", fraction = "", ...rest] = text.split(",");
    if (rest.length > 0 || !/^\d{1,3}(\.\d{3})*$|^\d+$/.test(whole)) return null;
    integerPart = whole.replaceAll(".", "");
    fractionPart = fraction;
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    integerPart = text.replaceAll(".", ""); // "1.250" = one thousand two hundred fifty
  } else if (/^\d+\.\d{1,2}$/.test(text)) {
    [integerPart = "", fractionPart = ""] = text.split("."); // numeric keypad: "12.5"
  } else if (/^\d+$/.test(text)) {
    integerPart = text;
  } else {
    return null;
  }

  if (!/^\d*$/.test(fractionPart) || fractionPart.length > 2) return null;
  const minor = Number(integerPart) * 100 + Number(fractionPart.padEnd(2, "0"));
  return Number.isSafeInteger(minor) ? sign * minor : null;
}

/** Percentage of an amount, rounded half away from zero to whole kuruş. percent is 0–100. */
export function percentOf(minor: number, percent: number): number {
  const exact = (minor * percent) / 100;
  return Math.sign(exact) * Math.round(Math.abs(exact));
}
