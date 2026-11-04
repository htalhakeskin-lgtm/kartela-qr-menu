import type { Metadata } from "next";

import { publicEnv } from "@/lib/public-env";

/**
 * 404 for URLs that match no route (SCR-051, plan K-32): the app has several root layouts
 * (platform + one per theme, ADR-0003), so there is no single layout to compose it from.
 * Also the destination of unknown hosts and of direct /tema-* requests (host rewrites, ADR-0002 v2);
 * its link therefore points to the platform's absolute address. A venue's own 404 lives in its theme
 * tree (D-11).
 *
 * Self-contained on purpose (plan K-35): this module is part of EVERY route's entry, so any
 * stylesheet or next/font it imports is preloaded on every page of every theme. Measured in
 * Faz 3: importing platform.css here made Rakım's menu download the platform's Inter (+132 KB,
 * Link preload header) and its LCP slipped. Inline styles and the system font only.
 */
export const metadata: Metadata = {
  title: "Sayfa bulunamadı · Kartela",
  description: "Aradığınız sayfa bulunamadı.",
  robots: { index: false, follow: false },
};

const ink = "#18181b";
const muted = "#5b5b63";
const green = "#1f5f4a";
const paper = "#f7f7f5";

export default function GlobalNotFound() {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          background: paper,
          color: ink,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main style={{ width: "100%", maxWidth: "36rem", margin: "0 auto", padding: "4rem 1rem" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, Menlo, Consolas, monospace",
              color: muted,
            }}
          >
            404
          </p>
          <h1
            style={{
              margin: "0.75rem 0 0",
              fontSize: "2rem",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Bu sayfa bulunamadı
          </h1>
          <p style={{ margin: "1rem 0 0", lineHeight: 1.6, color: muted }}>
            Adres yanlış yazılmış ya da sayfa kaldırılmış olabilir. Bir mekânın menüsünü arıyorsanız
            masadaki QR kodu yeniden okutun.
          </p>
          <a
            href={publicEnv.NEXT_PUBLIC_PLATFORM_URL}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              marginTop: "2rem",
              padding: "0 1.25rem",
              borderRadius: 6,
              background: green,
              color: paper,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Kartela ana sayfası
          </a>
        </main>
      </body>
    </html>
  );
}
