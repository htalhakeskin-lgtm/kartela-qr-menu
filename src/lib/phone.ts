/**
 * Phone input normalisation. Stored as E.164 (+905321234567), displayed with formatPhone().
 * Accepts the ways Turkish users type numbers: "0532 123 45 67", "532-123-4567", "+90 (532) 123 45 67".
 */
export function toE164TR(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national: string;
  if (digits.length === 12 && digits.startsWith("90")) national = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) national = digits.slice(1);
  else if (digits.length === 10) national = digits;
  else return null;
  // Turkish national numbers start with 2–5 (landline, mobile) or 8 (toll free).
  return /^[2-58]\d{9}$/.test(national) ? `+90${national}` : null;
}

/** wa.me link with a prefilled message (V-28). */
export function whatsappLink(e164: string, message?: string): string {
  const base = `https://wa.me/${e164.replace(/^\+/, "")}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
