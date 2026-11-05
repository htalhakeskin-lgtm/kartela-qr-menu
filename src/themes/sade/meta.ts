import { defineThemeMeta } from "@/platform/theme/contract";

/**
 * Sade — the reference ready-made theme (plan §11.8): every slot's base implementation and the
 * fallback of every other theme. The same values are declared in sade.css (conformance test).
 * Per-venue tokens arrive with D-39.
 */
export default defineThemeMeta({
  id: "sade",
  kind: "hazir",
  version: "0.1.0",
  supports: {
    rtl: true,
    layouts: { quick: ["liste", "kart", "izgara"], explore: ["akis", "dergi"] },
  },
  tokens: {
    color: {
      background: "#ffffff",
      surface: "#f7f7f5",
      surfaceMuted: "#eeeeea",
      foreground: "#18181b",
      mutedForeground: "#5b5b63",
      border: "#e4e4df",
      primary: "#1f5f4a",
      primaryForeground: "#ffffff",
      accent: "#1f5f4a",
      accentForeground: "#ffffff",
      soldOut: "#5b5b63",
      focus: "#18181b",
    },
  },
  tokenVariants: {
    // By preference only (system or the guest's choice); Sade has no evening set.
    dark: {
      background: "#121214",
      surface: "#1b1b1f",
      surfaceMuted: "#24242a",
      foreground: "#ececee",
      mutedForeground: "#a9a9b2",
      border: "#2c2c33",
      primary: "#7cc8a8",
      primaryForeground: "#0f2a21",
      accent: "#7cc8a8",
      accentForeground: "#0f2a21",
      soldOut: "#a9a9b2",
      focus: "#ececee",
    },
  },
  motion: { enter: "fade", sheet: "ease", priceTick: false },
});
