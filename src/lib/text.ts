/**
 * Turkish-aware text helpers (03-kod §8). Never call toLocaleLowerCase()/localeCompare()
 * without a locale: "I".toLocaleLowerCase() is "ı" in Turkish but "i" elsewhere.
 */

const TURKISH_ASCII: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** Lowercases with Turkish rules and strips diacritics: "IŞIK İçin" → "isik icin". For search keys. */
export function toSearchKey(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]/g, (char) => TURKISH_ASCII[char] ?? char)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** URL slug, Turkish ASCII, kebab-case: "Diş Beyazlatma & Bakım" → "dis-beyazlatma-bakim". */
export function slugify(text: string): string {
  return toSearchKey(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const collator = new Intl.Collator("tr", { sensitivity: "base", numeric: true });

/** Turkish alphabetical order: "Çorum" after "Cide", "İzmir" after "Iğdır". */
export function compareTurkish(a: string, b: string): number {
  return collator.compare(a, b);
}
