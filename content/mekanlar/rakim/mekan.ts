import { defineVenue } from "../../../src/platform/tenant/registry-schema";

/**
 * Rakım Kahve Kavurma — üçüncü dalga kahveci, Moda / Kadıköy (plan VR-02). Kurgusal.
 * EN (plan: TR + EN) içerik çevirileriyle birlikte D-14'te eklenir.
 */
export default defineVenue({
  slug: "rakim",
  name: "Rakım Kahve Kavurma",
  kind: "coffee",
  theme: "rakim",
  locales: ["tr"],
  defaultLocale: "tr",
  domains: ["rakim-kahve.vercel.app"],
  mode: "demo",
});
