import "@/themes/rakim/rakim.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { rakimFontClassName } from "@/themes/rakim/fonts";

/**
 * Root layout of the Rakım theme tree (ADR-0003). Only this tree loads Rakım's fonts and
 * stylesheet. Faz 3: static params for the measurement page; D-01 / D-11 replace them with the
 * venues that use this theme and the venue's own metadata.
 */
export function generateStaticParams() {
  return [{ mekan: "rakim", dil: "tr" }];
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
    <html lang={dil} dir={dil === "ar" ? "rtl" : "ltr"} className={rakimFontClassName}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
