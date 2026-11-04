/**
 * Defaults for the platform_settings row (plan K-07; 02-mimari §4). Venue information lives in
 * venue_settings, one row per venue (D-02). The panel edits the database copy; these values seed
 * it. Demo values follow 17-icerik-ve-demo-verisi §3: the business line is the developer's own
 * number (IC-01), e-mail addresses use example.com.
 */
export const platformDefaults = {
  name: "Kartela",
  tagline: "Tek altyapı, her mekâna kendi menüsü",
  description:
    "Kafe, restoran ve barlar için QR ile açılan, her mekânın kendi alan adında ve kendi temasıyla çalışan dijital menü altyapısı.",
  contact: {
    phone: "+905423115888",
    email: "iletisim@kartela.example.com",
  },
  legalName: "Kartela (gösterim amaçlı demo)",
  seo: {
    titleTemplate: "%s · Kartela",
    defaultDescription:
      "Kartela: kafe, restoran ve barlar için her mekânın kendi alan adında, kendi temasıyla açılan QR menü altyapısı.",
  },
} as const;

export type PlatformDefaults = typeof platformDefaults;
