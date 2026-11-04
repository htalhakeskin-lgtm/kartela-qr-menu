import { defineThemeMeta } from "@/platform/theme/contract";

/**
 * Rakım — "Demleme Defteri" (plan §11). Day set by default; the evening set "Gece defteri"
 * (§11.2, K-19) is its own design and applies from 19:00 and under a dark colour preference.
 * The same values are declared in rakim.css; the conformance test keeps the two equal.
 */
export default defineThemeMeta({
  id: "rakim",
  kind: "ozel",
  version: "0.1.0",
  supports: { rtl: false, layouts: { quick: ["liste"], explore: ["dergi"] } },
  tokens: {
    color: {
      background: "#f3f1ec",
      surface: "#fbfaf7",
      surfaceMuted: "#e9e5dd",
      foreground: "#1f1d1a",
      mutedForeground: "#5e5a54",
      border: "#dad5cc",
      primary: "#1f1d1a",
      primaryForeground: "#f3f1ec",
      accent: "#b4441b",
      accentForeground: "#f3f1ec",
      soldOut: "#6b665e",
      focus: "#1f1d1a",
    },
  },
  tokenVariants: {
    dark: {
      background: "#161a1d",
      surface: "#1e2327",
      surfaceMuted: "#252b30",
      foreground: "#ece6da",
      mutedForeground: "#b3ac9f",
      border: "#2c3236",
      primary: "#ece6da",
      primaryForeground: "#161a1d",
      accent: "#e8955f",
      accentForeground: "#161a1d",
      soldOut: "#b3ac9f",
      focus: "#ece6da",
    },
    darkDayparts: ["aksam", "gece"],
  },
  motion: { enter: "rise", sheet: "ease", priceTick: true },
});
