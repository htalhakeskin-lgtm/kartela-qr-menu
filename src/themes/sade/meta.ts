import { defineThemeMeta } from "@/platform/theme/contract";

/**
 * Sade — the reference ready-made theme (plan §11.8): every slot's base implementation and the
 * fallback of every other theme. The same values are declared in sade.css (conformance test).
 * The dark set and per-venue tokens arrive with D-10.
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
  motion: { enter: "fade", sheet: "ease", priceTick: false },
});
