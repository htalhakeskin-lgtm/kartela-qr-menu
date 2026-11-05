import { defineVenue } from "../../../src/platform/tenant/registry-schema";

/**
 * Rakım Kahve Kavurma — üçüncü dalga kahveci, Moda / Kadıköy (plan VR-02). Kurgusal.
 * Türkçe ve İngilizce (plan VR-02); içerik çevirileri D-14'te, `en` dili D-15'te gerçek tema sayfasıyla.
 */
export default defineVenue({
  slug: "rakim",
  name: "Rakım Kahve Kavurma",
  kind: "coffee",
  theme: "rakim",
  locales: ["tr", "en"],
  defaultLocale: "tr",
  domains: ["rakim-kahve.vercel.app"],
  mode: "demo",
});
