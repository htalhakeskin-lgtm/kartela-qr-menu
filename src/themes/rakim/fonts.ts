import localFont from "next/font/local";

/**
 * Rakım's type pair (plan §11.3): Schibsted Grotesk (variable 400–700, headings + body) and IBM
 * Plex Mono 500 (data and prices, tabular figures). Self-hosted Turkish subsets (K-46,
 * fonts/README.md): one file each instead of Google's latin + latin-ext pair, 67.7 KB → 37.9 KB for
 * the text face. Grotesk's own ₺ is drawn as the old lira sign ₤, so it is left out: text set in
 * Grotesk gets ₺ from the system font; prices are set in Plex Mono, whose ₺ is right. Only this
 * theme's root layout imports this module (ADR-0003).
 */
const grotesk = localFont({
  src: [{ path: "./fonts/schibsted-grotesk-tr.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-rakim-sans",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

// Not preloaded (plan K-36): prices and data swap in from the fallback mono a moment later, and
// the featured photo (LCP) gets the bandwidth on a slow connection. Measured in Faz 3.
const mono = localFont({
  src: [{ path: "./fonts/plex-mono-500-tr.woff2", weight: "500", style: "normal" }],
  variable: "--font-rakim-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const rakimFontClassName = `${grotesk.variable} ${mono.variable}`;
