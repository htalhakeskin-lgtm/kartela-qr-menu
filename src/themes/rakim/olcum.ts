/**
 * Faz 3 measurement content (RSK-01, plan K-27): the first screen of Rakım's quick menu with real
 * menu rows, so the framework baseline and Lighthouse are measured on a realistic page (fonts,
 * the featured photo as LCP, ~10 rows). D-15 replaces this module with the theme's real page fed
 * by the menu engine (D-03, D-04); the content moves to content/mekanlar/rakim/.
 */
export type MeasureItem = {
  name: string;
  description: string;
  data: string; // monospace data line: ratio, temperature, origin…
  priceMinor: number;
  image?: { src: string; alt: string };
};

export type MeasureSection = { id: string; title: string; items: readonly MeasureItem[] };

const unsplash = (id: string, ratio = "1:1") =>
  `https://images.unsplash.com/photo-${id}?fit=crop&ar=${ratio}&crop=entropy`;

export const featured = {
  label: "Günün filtresi",
  name: "Etiyopya Guji · V60",
  description: "Yıkanmış işleme, 2.100 m. Bergamot, şeftali ve bal; açık gövdeli, uzun bitiş.",
  data: "15 g · 250 ml · 93 °C · 3:15",
  priceMinor: 24000,
  image: {
    src: unsplash("1521677446241-d182a96ec49f", "4:3"),
    alt: "Yukarıdan çekilmiş V60 demleme hunisinde kâğıt filtre ve öğütülmüş kahve",
  },
};

export const sections: readonly MeasureSection[] = [
  {
    id: "filtre",
    title: "Filtre",
    items: [
      {
        name: "Kolombiya Huila · Chemex",
        description: "Kırmızı elma, karamel, yumuşak asidite. İki kişilik.",
        data: "30 g · 500 ml · 94 °C",
        priceMinor: 26000,
        image: {
          src: unsplash("1669303503510-b17e5947abaa"),
          alt: "Beyaz zeminde ahşap tabure üzerindeki fincana metal demlikten kahve dökülüyor",
        },
      },
      {
        name: "Kenya Nyeri · AeroPress",
        description: "Frenk üzümü ve greyfurt; parlak, sulu.",
        data: "15 g · 220 ml · 85 °C",
        priceMinor: 25000,
      },
      {
        name: "Günün demlemesi",
        description: "Ev harmanından hazır demleme; doldurma bir kez ücretsiz.",
        data: "Brezilya · Kolombiya",
        priceMinor: 19000,
        image: {
          src: unsplash("1493606278519-11aa9f86e40a"),
          alt: "Beyaz masada yukarıdan çekilmiş beyaz fincanda sade kahve",
        },
      },
      {
        name: "Soğuk demleme",
        description: "On altı saat soğuk suda; buzlu ya da sade.",
        data: "Ruanda · 1:8",
        priceMinor: 23000,
      },
    ],
  },
  {
    id: "espresso",
    title: "Espresso",
    items: [
      {
        name: "Espresso",
        description: "Ev harmanı; isterseniz günün tek kökenli çekirdeğiyle.",
        data: "18 g → 36 g · 28 sn",
        priceMinor: 15000,
      },
      {
        name: "Cortado",
        description: "Eşit oranda espresso ve sıcak süt.",
        data: "Çift shot · 120 ml",
        priceMinor: 19000,
        image: {
          src: unsplash("1610889556528-9a770e32642f"),
          alt: "Beyaz zeminde tabak üzerinde cam bardakta cortado",
        },
      },
      {
        name: "Flat white",
        description: "İnce köpüklü süt, çift ristretto.",
        data: "Çift ristretto · 180 ml",
        priceMinor: 23000,
      },
      {
        name: "Latte",
        description: "Boyu, sütü ve shot sayısı sizin seçiminiz.",
        data: "8 oz · 12 oz",
        priceMinor: 24000,
        image: {
          src: unsplash("1630993671627-094c308f6902"),
          alt: "Beyaz zeminde yukarıdan üç fincan: süt, sütlü kahve ve sade kahve",
        },
      },
    ],
  },
];
