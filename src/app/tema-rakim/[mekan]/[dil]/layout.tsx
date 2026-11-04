import "@/themes/rakim/rakim.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { isRtl, themeLocaleParams } from "@/platform/tenant/registry";
import { PrePaint } from "@/platform/theme/pre-paint";
import { rakimFontClassName } from "@/themes/rakim/fonts";

/**
 * Root layout of the Rakım theme tree (ADR-0003). Only this tree loads Rakım's fonts and
 * stylesheet. Static params come from the venue registry (D-01); the page 404s for a venue or
 * locale this theme does not serve. D-11 adds the venue's own metadata (canonical, OG, JSON-LD).
 */
export function generateStaticParams() {
  return themeLocaleParams("rakim");
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#161a1d" },
  ],
};

export default async function RakimRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ mekan: string; dil: string }>;
}) {
  const { dil } = await params;
  return (
    <html lang={dil} dir={isRtl(dil) ? "rtl" : "ltr"} className={rakimFontClassName}>
      <head>
        <PrePaint />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
