import { defineVenue } from "../../../src/platform/tenant/registry-schema";

/**
 * Test fikstürü: hazır tema Sade ile ikinci bir mekân, sağdan sola dil dahil. Yönlendirme,
 * kiracı yalıtımı ve tema uygunluk testleri bunu kullanır. Üretim derlemesinin alan adı
 * haritasına girmez (fixture: true); yerelde ornek.localhost:3020.
 */
export default defineVenue({
  slug: "ornek",
  name: "Örnek Mekân",
  theme: "sade",
  locales: ["tr", "en", "ar"],
  defaultLocale: "tr",
  domains: [],
  mode: "demo",
  fixture: true,
});
