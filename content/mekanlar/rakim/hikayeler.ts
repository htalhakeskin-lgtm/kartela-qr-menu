import { defineStories } from "../../../src/platform/menu/content";

/**
 * Rakım'ın Keşfet hikâyeleri (plan §11.5, D-14): köken bölümleri (deniz seviyesinden 2.100
 * metreye), V60 ve Chemex demleme rehberleri, fırın ortağı ve barista notu. Gövdeler
 * hikayeler/{slug}.{dil}.md. Mekân, üreticiler ve fırın kurgusaldır; demleme oranları gerçektir.
 */
export default defineStories([
  {
    slug: "deniz-seviyesinden",
    kind: "chapter",
    collection: "koken",
    title: { tr: "Deniz seviyesinden 2.100 metreye", en: "From sea level to 2,100 metres" },
    summary: {
      tr: "Moda'da içtiğiniz fincanın yolu, dağ yamaçlarındaki bir kahve ağacında başlar.",
      en: "The cup you drink in Moda starts its journey on a coffee tree high on a mountainside.",
    },
    cover: "kesfet-giris-kahve-agaci",
  },
  {
    slug: "guji",
    kind: "chapter",
    collection: "koken",
    title: { tr: "Guji: bergamot ve şeftali", en: "Guji: bergamot and peach" },
    summary: {
      tr: "Etiyopya'nın güneyinde, 2.000 metrenin üstünde küçük bahçeler.",
      en: "Small gardens above 2,000 metres in southern Ethiopia.",
    },
    cover: "koken-guji-kiraz",
    items: ["etiyopya-guji", "gunun-filtresi"],
  },
  {
    slug: "huila",
    kind: "chapter",
    collection: "koken",
    title: { tr: "Huila: elma ve karamel", en: "Huila: apple and caramel" },
    summary: {
      tr: "Kolombiya And'larında, iki hasatlı yamaçlar.",
      en: "Slopes with two harvests a year in the Colombian Andes.",
    },
    cover: "koken-huila-agac",
    items: ["kolombiya-huila", "chemex"],
  },
  {
    slug: "nyeri",
    kind: "chapter",
    collection: "koken",
    title: { tr: "Nyeri: yıkanmış ve parlak", en: "Nyeri: washed and bright" },
    summary: {
      tr: "Kenya dağının eteklerinde, yıkama istasyonunda geçen iki gün.",
      en: "Two days at a washing station on the slopes of Mount Kenya.",
    },
    cover: "koken-nyeri-yikama",
    items: ["kenya-nyeri", "aeropress"],
  },
  {
    slug: "v60-kagidi-islatin",
    kind: "guide",
    collection: "v60-rehberi",
    title: { tr: "Kâğıdı ıslatın", en: "Rinse the paper" },
    cover: "rehber-v60-filtre",
    items: ["gunun-filtresi"],
  },
  {
    slug: "v60-ciceklenme",
    kind: "guide",
    collection: "v60-rehberi",
    title: { tr: "Çiçeklenmeyi bekleyin", en: "Let it bloom" },
    cover: "rehber-v60-ciceklenme",
  },
  {
    slug: "v60-yavas-dokun",
    kind: "guide",
    collection: "v60-rehberi",
    title: { tr: "Yavaş, daireler çizerek dökün", en: "Pour slowly, in circles" },
    cover: "rehber-v60-dokme",
  },
  {
    slug: "v60-tartin",
    kind: "guide",
    collection: "v60-rehberi",
    title: { tr: "Tartın ve süzülmesini bekleyin", en: "Weigh it and let it drain" },
    cover: "rehber-v60-tartim",
    items: ["etiyopya-guji"],
  },
  {
    slug: "chemex-oran",
    kind: "guide",
    collection: "chemex-rehberi",
    title: { tr: "Chemex: iki fincan için 30 gram", en: "Chemex: 30 grams for two cups" },
    cover: "rehber-chemex",
    items: ["chemex"],
  },
  {
    slug: "chemex-servis",
    kind: "guide",
    collection: "chemex-rehberi",
    title: { tr: "Filtreyi çıkarın, çalkalayın", en: "Lift the filter, swirl" },
  },
  {
    slug: "moda-eksi-maya",
    kind: "supplier",
    title: { tr: "Fırın ortağımız: Moda Ekşi Maya", en: "Our bakery partner: Moda Ekşi Maya" },
    summary: {
      tr: "Kruvasan ve çörekler iki sokak ötedeki fırından, günde iki kez.",
      en: "Croissants and rolls from a bakery two streets away, twice a day.",
    },
    cover: "firin-kruvasanlar",
    items: ["kruvasan", "tarcinli-corek"],
  },
  {
    slug: "barista-notu",
    kind: "chef_note",
    title: { tr: "Barista notu: neden tartıyoruz?", en: "Barista note: why we weigh" },
    items: ["espresso", "flat-white"],
  },
]);
