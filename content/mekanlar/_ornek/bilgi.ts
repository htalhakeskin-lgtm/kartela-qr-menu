import { defineVenueInfo } from "../../../src/platform/menu/content";

/**
 * Test fixture venue information (D-11): a fictional lokanta. The phone and WhatsApp line is the
 * developer's (VR-06); the address is invented and says so on the page (demo note). Sunday is
 * closed, like the menu of the day.
 */
export default defineVenueInfo({
  description: {
    tr: "Sirkeci'de sabah çorbasından akşam sulu yemeğine, her gün değişen esnaf lokantası menüsü.",
    en: "A tradesmen's restaurant in Sirkeci: soup in the morning, home-style stews until evening, a menu that changes daily.",
    ar: "مطعم شعبي في سيركجي: شوربة في الصباح وأطباق مطبوخة حتى المساء، وقائمة تتغير يوميًا.",
  },
  address: "Örnek Sokak No: 1, Sirkeci, Fatih / İstanbul",
  mapUrl: "https://www.openstreetmap.org/#map=18/41.0136/28.9766",
  phone: "+905423115888",
  whatsapp: "+905423115888",
  hours: {
    "1": [{ open: "07:00", close: "21:00" }],
    "2": [{ open: "07:00", close: "21:00" }],
    "3": [{ open: "07:00", close: "21:00" }],
    "4": [{ open: "07:00", close: "21:00" }],
    "5": [{ open: "07:00", close: "21:00" }],
    "6": [{ open: "08:00", close: "16:00" }],
  },
  wifi: { network: "Ornek-Misafir", password: "corba2026" },
  faq: [
    {
      q: {
        tr: "Yarım porsiyon var mı?",
        en: "Do you serve half portions?",
        ar: "هل تقدمون نصف حصة؟",
      },
      a: {
        tr: 'Sulu yemeklerin çoğunda var; menüde "Yarım" fiyatıyla yazılı.',
        en: 'For most stews, yes: look for the "Half" price on the menu.',
        ar: "نعم لمعظم الأطباق المطبوخة، ابحث عن سعر «نصف» في القائمة.",
      },
    },
    {
      q: {
        tr: "Kartla ödeme alıyor musunuz?",
        en: "Do you take cards?",
        ar: "هل تقبلون البطاقات؟",
      },
      a: { tr: "Evet, bütün kartları alıyoruz.", en: "Yes, all cards.", ar: "نعم، جميع البطاقات." },
    },
    {
      q: {
        tr: "Pazar günü açık mısınız?",
        en: "Are you open on Sunday?",
        ar: "هل أنتم مفتوحون يوم الأحد؟",
      },
      a: {
        tr: "Pazar kapalıyız; cumartesi 16:00'ya kadar açığız.",
        en: "We are closed on Sunday and open until 4 pm on Saturday.",
        ar: "نغلق يوم الأحد، ونفتح يوم السبت حتى الساعة 16:00.",
      },
    },
  ],
});
