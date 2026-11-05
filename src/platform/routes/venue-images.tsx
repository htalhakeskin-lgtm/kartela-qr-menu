import "server-only";

import { ImageResponse } from "next/og";

import { themeMeta } from "@/themes/meta";

import { getVenue, venueOrigin } from "../tenant/registry";
import type { ThemeId } from "../tenant/registry-schema";

/**
 * Share image and favicon of a venue (D-11, SEO-06): drawn from its theme's tokens, so every
 * venue on a ready-made theme gets its own without a design file. A custom theme may replace them
 * with its own files in its tree (D-15). Only the venue's name and address appear: they are Latin
 * script for every venue, and the built-in font has no Arabic glyphs.
 */
export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };
export const ICON_SIZE = { width: 64, height: 64 };

function venueOf(theme: ThemeId, slug: string) {
  const venue = getVenue(slug);
  return venue?.theme === theme ? venue : undefined;
}

export function venueShareImage(theme: ThemeId, slug: string): ImageResponse {
  const venue = venueOf(theme, slug);
  const { color } = themeMeta[theme].tokens;
  const host = venue ? new URL(venueOrigin(venue)).host : "";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 80,
        background: color.background,
        color: color.foreground,
        borderBottom: `24px solid ${color.primary}`,
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05 }}>
        {venue?.name ?? ""}
      </div>
      <div style={{ marginTop: 28, fontSize: 36, color: color.mutedForeground }}>{host}</div>
    </div>,
    SHARE_IMAGE_SIZE,
  );
}

export function venueIcon(theme: ThemeId, slug: string): ImageResponse {
  const venue = venueOf(theme, slug);
  const { color } = themeMeta[theme].tokens;
  const initial = venue ? (Array.from(venue.name)[0] ?? "") : "";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        background: color.primary,
        color: color.primaryForeground,
        fontSize: 40,
        fontWeight: 700,
      }}
    >
      {initial}
    </div>,
    ICON_SIZE,
  );
}
