import "@/themes/sade/sade.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { isRtl, themeLocaleParams } from "@/platform/tenant/registry";

/**
 * Root layout of the Sade theme tree (ADR-0003), shared by every venue on the ready-made theme.
 * D-01 skeleton: registry-driven static params and dir="rtl" for Arabic; D-09 / D-10 build the
 * theme, D-11 the venue metadata. No next/font yet: a venue's font pairing loads only here (D-09).
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
    <html lang={dil} dir={isRtl(dil) ? "rtl" : "ltr"}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
