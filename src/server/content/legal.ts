import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { cacheLife } from "next/cache";

/**
 * Legal texts live in content/yasal/*.md with a small front matter (baslik, surum, yururluk).
 * Read at build time by the static legal pages ("use cache": the text only changes with a deploy);
 * HTML comments (template notes) are dropped.
 */
export const LEGAL_DOCUMENTS = {
  kvkk: "kvkk-aydinlatma.md",
  gizlilik: "gizlilik-politikasi.md",
  cerez: "cerez-politikasi.md",
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_DOCUMENTS;

export type LegalDocument = { title: string; version: string; effectiveOn: string; body: string };

export async function readLegalDocument(key: LegalDocumentKey): Promise<LegalDocument> {
  "use cache";
  cacheLife("max");
  const file = path.join(process.cwd(), "content", "yasal", LEGAL_DOCUMENTS[key]);
  const raw = (await readFile(file, "utf8")).replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  if (!match?.[1]) throw new Error(`${LEGAL_DOCUMENTS[key]}: front matter missing`);
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator > 0) meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  const body = raw
    .slice(match[0].length)
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  return {
    title: meta.baslik ?? key,
    version: meta.surum ?? "1.0",
    effectiveOn: meta.yururluk ?? "",
    body,
  };
}
