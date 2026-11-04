import "./platform.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";

import { DemoBanner } from "@/components/layout/demo-banner";
import { PlatformFooter } from "@/components/platform/platform-footer";
import { platformDefaults } from "@/config/platform-defaults";
import { publicEnv } from "@/lib/public-env";

/**
 * Root layout of the platform host (ADR-0003: one root layout per theme tree + this one). Venue
 * sites never render it. The panel gets its own root layout in D-18.
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"], // Turkish needs latin-ext (ğ ş ı İ)
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_PLATFORM_URL),
  title: {
    default: "Kartela · Çok mekânlı QR menü",
    template: platformDefaults.seo.titleTemplate,
  },
  description: platformDefaults.seo.defaultDescription,
  applicationName: platformDefaults.name,
  // public/ file at a fixed address (icon files inside a route group get a hashed URL).
  icons: { icon: "/kartela-icon.svg" },
};

export const viewport: Viewport = { themeColor: "#f7f7f5" };

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#icerik"
          className="sr-only z-50 bg-foreground text-background focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:px-4 focus:py-3"
        >
          İçeriğe geç
        </a>
        <DemoBanner />
        <header className="border-b border-border">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center text-lg font-semibold tracking-tight"
            >
              {platformDefaults.name}
            </Link>
            <p className="text-sm text-muted-foreground">Çok mekânlı QR menü</p>
          </div>
        </header>
        <div id="icerik" className="flex-1">
          {children}
        </div>
        <PlatformFooter />
      </body>
    </html>
  );
}
