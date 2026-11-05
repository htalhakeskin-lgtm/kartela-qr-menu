import "../kartela.css";

import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { PanelDemoStrip } from "@/components/panel/demo-strip";

import { inter } from "../fonts";

/**
 * The panel's own root layout (ADR-0003, D-18; 13-yonetim-paneli §3): Kartela's tokens and Inter,
 * never a venue theme. LTR only (plan §11.8).
 *
 * Rendered for every request, with no prerendered shell: the panel's CSP carries a per-request
 * nonce (src/proxy.ts, 11-guvenlik §8), and a static shell's scripts would have none. Hence
 * `connection()` before anything renders, and `instant = false` so the route may block on the
 * server instead of producing a static shell (Next.js 16.4 `instant` reference).
 */
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Kartela panel", template: "%s · Kartela panel" },
  robots: { index: false, follow: false },
  icons: { icon: "/kartela-icon.svg" },
};

export const viewport: Viewport = { themeColor: "#f7f7f5" };

export default async function PanelRootLayout({ children }: { children: ReactNode }) {
  await connection();
  return (
    <html lang="tr" className={inter.variable}>
      <body className="min-h-dvh antialiased">
        <a
          href="#icerik"
          className="sr-only z-50 bg-foreground text-background focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-4 focus:py-3"
        >
          İçeriğe geç
        </a>
        <PanelDemoStrip />
        {children}
      </body>
    </html>
  );
}
