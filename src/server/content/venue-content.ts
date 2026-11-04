import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { type MenuContent, parseMenuContent } from "@/platform/menu/content";
import { LOCALES } from "@/platform/tenant/registry-schema";

import { venueContents } from "../../../content/mekanlar/icerik";

/**
 * A venue's content as the seed writes it (D-04, D-07): the menu file plus its stories, each with
 * its Markdown body read from content/mekanlar/{folder}/hikayeler/{slug}.{dil}.md, validated as one.
 * A missing language file is simply an untranslated body (it falls back, BR-MNU-003); a missing
 * Turkish file fails validation. HTML comments (author notes) are dropped.
 */
export async function loadVenueContent(slug: string): Promise<MenuContent | null> {
  const entry = venueContents[slug];
  if (!entry) return null;
  const folder = path.join(process.cwd(), "content", "mekanlar", entry.folder, "hikayeler");
  const stories = await Promise.all(
    (entry.stories ?? []).map(async (story) => ({
      ...story,
      body: await readBodies(folder, story.slug),
    })),
  );
  return parseMenuContent(slug, { ...entry.menu, stories });
}

async function readBodies(folder: string, slug: string): Promise<Record<string, string>> {
  const bodies: Record<string, string> = {};
  for (const locale of LOCALES) {
    const file = path.join(folder, `${slug}.${locale}.md`);
    const text = await readFile(file, "utf8").catch((error: unknown) => {
      if ((error as { code?: string }).code === "ENOENT") return null;
      throw error;
    });
    if (text !== null) {
      bodies[locale] = text
        .replace(/\r\n/g, "\n")
        .replace(/<!--[\s\S]*?-->/g, "")
        .trim();
    }
  }
  return bodies;
}

/** Slugs of the venues that have a content file. */
export function venuesWithContent(): string[] {
  return Object.keys(venueContents);
}
