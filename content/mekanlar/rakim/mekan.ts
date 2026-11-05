import { defineVenue } from "../../../src/platform/tenant/registry-schema";

/**
 * Rakım Kahve Kavurma — üçüncü dalga kahveci, Moda / Kadıköy (plan VR-02). Kurgusal.
 * İçerik TR + EN hazır (D-14); `en` dili, gerçek tema sayfası geldiğinde D-15'te açılır (K-46).
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
