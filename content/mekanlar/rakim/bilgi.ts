import { defineVenueInfo } from "../../../src/platform/menu/content";

/**
 * Rakım'ın bilgi sayfası (SCR-005, D-14). Kurgusal mekân: adres semt düzeyinde, telefon ve
 * WhatsApp hattı geliştiricinin (VR-06); demo notu alt bilgide durur.
 */
export default defineVenueInfo({
  description: {
    tr: "Moda'da üçüncü dalga kahveci: kendi kavurduğumuz tek kökenli çekirdekler, filtre ve espresso, fırın ortağımızdan taze kruvasan.",
    en: "A third-wave coffee bar in Moda: single-origin beans we roast ourselves, filter and espresso, fresh croissants from our bakery partner.",
  },
  address: "Moda Caddesi, Moda, Kadıköy / İstanbul",
  mapUrl: "https://www.openstreetmap.org/#map=17/40.9845/29.0265",
  phone: "+905423115888",
  whatsapp: "+905423115888",
  hours: {
    "1": [{ open: "08:00", close: "20:00" }],
    "2": [{ open: "08:00", close: "20:00" }],
    "3": [{ open: "08:00", close: "20:00" }],
    "4": [{ open: "08:00", close: "20:00" }],
    "5": [{ open: "08:00", close: "21:00" }],
    "6": [{ open: "09:00", close: "21:00" }],
    "7": [{ open: "09:00", close: "19:00" }],
  },
  wifi: { network: "Rakim-Misafir", password: "demleme2026" },
  faq: [
    {
      q: { tr: "Çekirdekleri öğütüyor musunuz?", en: "Do you grind the beans?" },
      a: {
        tr: "Evet, demleme yönteminizi söylerseniz paketi sizin için öğütürüz. Tazeliği en uzun korumak için çekirdek olarak almanızı öneririz.",
        en: "Yes, tell us how you brew and we grind the bag for you. Whole beans keep their freshness longest.",
      },
    },
    {
      q: { tr: "Bilgisayarla çalışılabilir mi?", en: "Can I work on a laptop?" },
      a: {
        tr: "Hafta içi her saat; cumartesi ve pazar 11:00–16:00 arası masaları sohbet için ayırıyoruz.",
        en: "Any time on weekdays; on Saturday and Sunday we keep the tables for conversation between 11:00 and 16:00.",
      },
    },
    {
      q: { tr: "Bitki bazlı süt var mı?", en: "Do you have plant milk?" },
      a: {
        tr: "Yulaf ve badem sütü var; laktozsuz inek sütü de seçebilirsiniz.",
        en: "Oat and almond milk, and lactose-free cow's milk too.",
      },
    },
  ],
  allergenStatement: {
    tr: "Fırın ürünlerimiz gluten, süt, yumurta ve fındık işlenen bir mutfakta hazırlanır. Alerjiniz varsa siparişten önce baristamıza söyleyin.",
    en: "Our pastries are made in a kitchen that handles gluten, milk, eggs and hazelnuts. Please tell the barista about any allergy before you order.",
  },
});
