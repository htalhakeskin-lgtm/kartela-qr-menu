import { Inter } from "next/font/google";

/**
 * Sade's default type (plan §11.8, pairing 1): Inter, variable, latin + latin-ext. Arabic falls
 * back to the system's Arabic face (Noto Sans Arabic in the stack). The per-venue pairing
 * catalogue arrives with D-39. Only this theme's root layout imports this module (ADR-0003).
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sade-sans",
  display: "swap",
});

export const sadeFontClassName = inter.variable;
