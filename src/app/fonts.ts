import { Inter } from "next/font/google";

/**
 * Kartela's own typeface (plan §11.8), shared by the platform and panel root layouts so both use
 * the same font files. Never import it from global-not-found / global-error or a theme tree: the
 * font would then be preloaded on every venue site (K-35).
 */
export const inter = Inter({
  subsets: ["latin", "latin-ext"], // Turkish needs latin-ext (ğ ş ı İ)
  variable: "--font-inter",
  display: "swap",
});
