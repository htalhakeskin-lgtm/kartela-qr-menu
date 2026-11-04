import { defineStories } from "../../../src/platform/menu/content";

/**
 * Test fixture stories (D-07): a supplier story without an image (a first-class state), a chef
 * note with a cover and no Arabic body (falls back to Turkish), and a two-stop tea guide.
 * Bodies: hikayeler/{slug}.{dil}.md. Fictional, like the venue.
 */
export default defineStories([
  {
    slug: "fasulyenin-yolu",
    kind: "supplier",
    title: { tr: "Fasulyenin yolu", en: "Where our beans come from", ar: "من أين تأتي فاصولياؤنا" },
    summary: {
      tr: "Her sonbahar aynı yayla köyünden gelen kuru fasulye.",
      en: "Dried beans from the same highland village every autumn.",
    },
    items: ["zeytinyagli-kuru-fasulye", "esnaf-tabagi"],
  },
  {
    slug: "ustanin-notu",
    kind: "chef_note",
    title: { tr: "Ustanın notu: öğleden sonra kahvesi", en: "From the cook: the afternoon coffee" },
    cover: "fincan-sade-kahve",
    items: ["turk-kahvesi"],
  },
  {
    slug: "cay-demligi-isitmak",
    kind: "guide",
    collection: "cay-demleme",
    title: { tr: "Demliği ısıtın", en: "Warm the teapot", ar: "سخّن إبريق الشاي" },
    items: ["cay"],
  },
  {
    slug: "cay-demlenmesi",
    kind: "guide",
    collection: "cay-demleme",
    title: { tr: "On beş dakika bekleyin", en: "Wait fifteen minutes", ar: "انتظر خمس عشرة دقيقة" },
    items: ["cay"],
  },
]);
