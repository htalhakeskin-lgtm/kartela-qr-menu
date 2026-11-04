import "@/themes/sade/sade.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { isRtl, themeLocaleParams } from "@/platform/tenant/registry";
import { PrePaint } from "@/platform/theme/pre-paint";
import { sadeFontClassName } from "@/themes/sade/fonts";

/**
 * Root layout of the Sade theme tree (ADR-0003), shared by every venue on the ready-made theme.
 * Registry-driven static params, dir="rtl" for Arabic, Sade's type and the pre-paint script; D-11
 * adds the venue metadata. A font loaded here reaches only Sade venues (ADR-0003, K-35).
 */
export function generateStaticParams() {
  return themeLocaleParams("sade");
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default async function SadeRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ mekan: string; dil: string }>;
}) {
  const { dil } = await params;
  return (
    <html lang={dil} dir={isRtl(dil) ? "rtl" : "ltr"} className={sadeFontClassName}>
      <head>
        <PrePaint />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
