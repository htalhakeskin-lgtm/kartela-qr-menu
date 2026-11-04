import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";

/**
 * Rakım's type pair (plan §11.3): Schibsted Grotesk (variable, headings + body) and IBM Plex Mono
 * 500 (data and prices, tabular figures). latin + latin-ext = 4 files, the font budget
 * (12-performans §3). Only this theme's root layout imports this module (ADR-0003).
 */
const grotesk = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-rakim-sans",
  display: "swap",
});

// Not preloaded (plan K-36): prices and data swap in from the fallback mono a moment later, and
// the featured photo (LCP) gets the bandwidth on a slow connection. Measured in Faz 3.
const mono = IBM_Plex_Mono({
  weight: "500",
  subsets: ["latin", "latin-ext"],
  variable: "--font-rakim-mono",
  display: "swap",
  preload: false,
});

export const rakimFontClassName = `${grotesk.variable} ${mono.variable}`;
