import { ImageResponse } from "next/og";

import { platformDefaults } from "@/config/platform-defaults";

/**
 * Default share image of the platform pages (09-seo §2, SEO-06, GK-20), in the platform's
 * colours, at a fixed address: metadata image files inside a route group get a hashed URL
 * (/opengraph-image-1tixr7), which pageMetadata() could not reference. Prerendered at build.
 * Venue sites render their own from their theme tokens (D-11). The built-in font covers Turkish
 * letters (İ ı Ş ş Ğ ğ Ç Ö Ü).
 */
const size = { width: 1200, height: 630 };

const SWATCHES = [
  ["#f3f1ec", "#b4441b"],
  ["#161a1d", "#e8955f"],
  ["#ffffff", "#1f5f4a"],
] as const;

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#f7f7f5",
        color: "#18181b",
      }}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {SWATCHES.map(([background, accent]) => (
          <div
            key={background}
            style={{
              width: 120,
              height: 160,
              borderRadius: 20,
              background,
              border: "2px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "flex-end",
              padding: 16,
            }}
          >
            <div style={{ width: 56, height: 10, borderRadius: 5, background: accent }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>
          {platformDefaults.name}
        </div>
        <div style={{ marginTop: 16, fontSize: 36, color: "#5b5b63" }}>
          {platformDefaults.tagline}
        </div>
      </div>
    </div>,
    size,
  );
}
