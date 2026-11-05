import { defineMenuContent } from "../../../src/platform/menu/content";

/**
 * Rakım Kahve Kavurma — menü (plan §11.5, D-14). Kurgusal bir üçüncü dalga kahveci, Moda / Kadıköy;
 * Türkçe ve İngilizce. Sabah tabakları 08:00–12:00 arası ayrı bir menüde; gün boyu menüsünde filtre,
 * espresso, soğuk içecekler, fırın ortağının ürünleri ve paket çekirdekler.
 *
 * Görseller tek seri (gün ışığı, açık taş / beyaz zemin, net gölge; plan §11.6): kaynakları
 * docs/gorsel-kaynaklari.md'de. Fotoğrafsız ürünler bilerek fotoğrafsız (veri kartı, K-23).
 * Enerji değerleri tipik bir porsiyon için tahmindir, laboratuvar ölçümü değildir.
 */

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export default defineMenuContent({
  images: {
    "gunun-filtresi-v60": {
      source: "unsplash",
      url: unsplash("1620712692753-5b52d9e995f4"),
      width: 2562,
      height: 3843,
      photographer: "Art Rachen",
      sourcePage: "https://unsplash.com/photos/white-ceramic-cup-with-brown-liquid-LR_ZHJtlRFE",
      alt: {
        tr: "Beyaz V60 demleme hunisindeki kahveye ince ağızlı demlikten su dökülüyor",
        en: "Water poured from a gooseneck kettle onto coffee in a white V60 dripper",
      },
      focal: [45, 62],
    },
    "chemex-iki-kisilik": {
      source: "unsplash",
      url: unsplash("1636836722843-14c97dba94bc"),
      width: 3646,
      height: 4557,
      photographer: "Sama Hosseini",
      sourcePage:
        "https://unsplash.com/photos/a-beakle-filled-with-liquid-sitting-on-top-of-a-table-n8E3F9CyHow",
      alt: {
        tr: "Açık mermer üzerinde demlenmiş kahveyle dolu cam Chemex",
        en: "A glass Chemex filled with brewed coffee on light marble",
      },
      focal: [50, 60],
    },
    "demlik-kahve": {
      source: "unsplash",
      url: unsplash("1548287914-44c700af2ed5"),
      width: 5411,
      height: 3608,
      photographer: "Julien Labelle",
      sourcePage: "https://unsplash.com/photos/round-white-ceramic-coffee-cup-QYsR7LRu8UM",
      alt: {
        tr: "Beyaz zeminde yukarıdan çekilmiş beyaz fincanda filtre kahve",
        en: "Filter coffee in a white cup on a white surface, from above",
      },
      focal: [55, 45],
    },
    "espresso-fincan": {
      source: "unsplash",
      url: unsplash("1771680739786-9bc9584e332b"),
      width: 5721,
      height: 3819,
      photographer: "Monaz Nazary",
      sourcePage: "https://unsplash.com/photos/a-cup-of-coffee-on-a-white-saucer-A9pKF1tFMfw",
      alt: {
        tr: "Beyaz zeminde krem tabak üzerinde küçük fincanda espresso, yukarıdan",
        en: "Espresso in a small cup on a cream saucer, white background, from above",
      },
    },
    "cappuccino-ustten": {
      source: "unsplash",
      url: unsplash("1771623117490-58382d47f882"),
      width: 5701,
      height: 3806,
      photographer: "Monaz Nazary",
      sourcePage:
        "https://unsplash.com/photos/a-white-mug-filled-with-coffee-on-a-white-background-fW0kuquE8kQ",
      alt: {
        tr: "Beyaz zeminde köpüklü cappuccino dolu beyaz fincan, yukarıdan",
        en: "A white cup of frothy cappuccino on a white background, from above",
      },
    },
    "cortado-cam": {
      source: "unsplash",
      url: unsplash("1610889556528-9a770e32642f"),
      width: 7170,
      height: 4100,
      photographer: "Adi Goldstein",
      sourcePage: "https://unsplash.com/photos/clear-glass-cup-on-saucer-xKS-1DP4g7A",
      alt: {
        tr: "Beyaz zeminde tabak üzerinde cam bardakta cortado",
        en: "Cortado in a glass on a saucer, white background",
      },
      focal: [50, 55],
    },
    "flat-white-mermer": {
      source: "unsplash",
      url: unsplash("1587982704600-e5f79d652fe5"),
      width: 3000,
      height: 2000,
      photographer: "Coffee with Joshua",
      sourcePage:
        "https://unsplash.com/photos/white-ceramic-cup-with-brown-liquid-on-white-ceramic-saucer-1Sphewst6ak",
      alt: {
        tr: "Açık mermer masada tabağıyla flat white, süt köpüğünde desen",
        en: "A flat white with latte art on its saucer on a light marble table",
      },
      focal: [68, 55],
    },
    "latte-yaprak": {
      source: "unsplash",
      url: unsplash("1727080409436-356bdc609899"),
      width: 4328,
      height: 6492,
      photographer: "Polina Kuzovkova",
      sourcePage: "https://unsplash.com/photos/a-cup-of-coffee-on-a-saucer-on-a-table-2tfFzduVohU",
      alt: {
        tr: "Açık taş masada tabak üzerinde yaprak desenli latte",
        en: "A latte with a leaf pattern on a saucer on a light stone table",
      },
      focal: [45, 40],
    },
    "americano-ustten": {
      source: "unsplash",
      url: unsplash("1493606278519-11aa9f86e40a"),
      width: 2442,
      height: 1628,
      photographer: "Isaac Benhesed",
      sourcePage: "https://unsplash.com/photos/onLbXleIkds",
      alt: {
        tr: "Beyaz masada yukarıdan çekilmiş beyaz fincanda sade kahve",
        en: "Black coffee in a white cup on a white table, from above",
      },
      focal: [62, 55],
    },
    "espresso-tonik": {
      source: "unsplash",
      url: unsplash("1559496417-e7f25cb247f3"),
      width: 4491,
      height: 5614,
      photographer: "Jarek Ceborski",
      sourcePage:
        "https://unsplash.com/photos/clear-drinking-glass-with-coffee-on-top-of-white-table-IhqDpFz7I8Q",
      alt: {
        tr: "Beyaz masada yaprak gölgeleri arasında cam bardakta espresso tonik",
        en: "Espresso tonic in a glass among leaf shadows on a white table",
      },
      focal: [42, 62],
    },
    "buzlu-latte": {
      source: "unsplash",
      url: unsplash("1562447457-579fc34967fb"),
      width: 3207,
      height: 4811,
      photographer: "Empreinte",
      sourcePage: "https://unsplash.com/photos/iced-coffee-with-milk-pouring-02O1bXB_fgk",
      alt: {
        tr: "Ahşap altlık üzerinde buzlu kahveye süt dökülüyor",
        en: "Milk poured into iced coffee on a wooden coaster",
      },
      focal: [55, 55],
    },
    "soguk-demleme": {
      source: "unsplash",
      url: unsplash("1517959105821-eaf2591984ca"),
      width: 7223,
      height: 4804,
      photographer: "Blake Wisz",
      sourcePage:
        "https://unsplash.com/photos/selective-focus-photo-of-glass-of-brown-liquid-X6aY_j6JD_Y",
      alt: {
        tr: "Palmiye yaprağı gölgesinde cam bardakta buzlu soğuk demleme kahve",
        en: "Cold brew over ice in a glass under a palm leaf shadow",
      },
      focal: [55, 55],
    },
    "kruvasan-tabak": {
      source: "unsplash",
      url: unsplash("1698899720612-dcbf89481ace"),
      width: 5421,
      height: 3614,
      photographer: "Sandie Clarke",
      sourcePage:
        "https://unsplash.com/photos/a-croissant-on-a-plate-on-a-wooden-table-PZEQz_37APs",
      alt: {
        tr: "Açık renk ahşap masada beyaz tabakta tereyağlı kruvasan, yukarıdan",
        en: "A butter croissant on a white plate on a light wooden table, from above",
      },
      focal: [58, 50],
    },
    "tarcinli-corek": {
      source: "unsplash",
      url: unsplash("1742771737040-ec5f8fb9a9f0"),
      width: 6000,
      height: 4000,
      photographer: "aw",
      sourcePage:
        "https://unsplash.com/photos/a-delicious-cinnamon-roll-on-a-white-plate-KCgVGobIjgc",
      alt: {
        tr: "Beyaz tabakta üzeri şekerli kremalı tarçınlı çörek",
        en: "A cinnamon roll with icing on a white plate",
      },
    },
    "eksi-maya-yumurta": {
      source: "unsplash",
      url: unsplash("1525351484163-7529414344d8"),
      width: 3456,
      height: 3456,
      photographer: "Ben Kolde",
      sourcePage:
        "https://unsplash.com/photos/bread-with-sunny-side-up-egg-served-on-white-ceramic-plate-FFqNATH27EM",
      alt: {
        tr: "Beyaz kare tabakta ekşi mayalı ekmek üzerinde sahanda yumurta",
        en: "A fried egg on sourdough toast on a square white plate",
      },
    },
    "avokadolu-ekmek": {
      source: "unsplash",
      url: unsplash("1623691752472-a6d33855e5de"),
      width: 3456,
      height: 5184,
      photographer: "Fernanda Martinez",
      sourcePage:
        "https://unsplash.com/photos/sliced-tomato-and-green-vegetable-on-white-ceramic-plate-i7oMgm2EWrE",
      alt: {
        tr: "Beyaz zeminde avokado, domates ve beyaz peynirli ekmek dilimleri",
        en: "Toast with avocado, tomato and white cheese on a white surface",
      },
      focal: [40, 45],
    },
    "domatesli-ekmek": {
      source: "unsplash",
      url: unsplash("1621973569279-cd3b5c4bfd43"),
      width: 8158,
      height: 12223,
      photographer: "Karoline Henrique",
      sourcePage:
        "https://unsplash.com/photos/egg-with-tomato-and-green-vegetable-on-white-ceramic-plate-Fsdb3WNK84s",
      alt: {
        tr: "Beyaz tabaklarda domatesli ve biberli kızarmış ekmek dilimleri",
        en: "Toasted bread with tomato and peppers on white plates",
      },
      focal: [55, 70],
    },
    "cekirdek-guji": {
      source: "unsplash",
      url: unsplash("1513530176992-0cf39c4cbed4"),
      width: 4929,
      height: 3286,
      photographer: "NordWood Themes",
      sourcePage: "https://unsplash.com/photos/brown-coffee-bean-lot-ivP3TYdLvw0",
      alt: {
        tr: "Beyaz zemine dağılmış kavrulmuş kahve çekirdekleri",
        en: "Roasted coffee beans scattered on a white surface",
      },
    },
    "cekirdek-huila": {
      source: "unsplash",
      url: unsplash("1540965555-ef9a836372ed"),
      width: 2485,
      height: 2485,
      photographer: "Phil Desforges",
      sourcePage: "https://unsplash.com/photos/brown-coffee-beans-fjrl9YBYEL0",
      alt: {
        tr: "Beyaz zeminde küçük bir yığın kavrulmuş kahve çekirdeği",
        en: "A small pile of roasted coffee beans on white",
      },
    },
    "cekirdek-nyeri": {
      source: "unsplash",
      url: unsplash("1587049016823-69ef9d68bd44"),
      width: 4499,
      height: 4499,
      photographer: "Mockup Graphics",
      sourcePage: "https://unsplash.com/photos/brown-coffee-beans-on-white-surface-m7ijvnNGaV0",
      alt: {
        tr: "Beyaz zeminde yukarıdan kavrulmuş kahve çekirdeği yığını",
        en: "A heap of roasted coffee beans on white, from above",
      },
    },
    "cekirdek-harman": {
      source: "unsplash",
      url: unsplash("1587734195503-904fca47e0e9"),
      width: 3024,
      height: 4032,
      photographer: "Alin Luna",
      sourcePage:
        "https://unsplash.com/photos/brown-coffee-beans-on-white-ceramic-bowl-lGl3spVIU0g",
      alt: {
        tr: "Açık gri zeminde beyaz kâsede kavrulmuş kahve çekirdekleri",
        en: "Roasted coffee beans in a white bowl on light grey",
      },
      focal: [70, 50],
    },
    "kesfet-giris-kahve-agaci": {
      source: "unsplash",
      url: unsplash("1654815439629-5e93cb7f74a1"),
      width: 5616,
      height: 3744,
      photographer: "PROJETO CAFÉ GATO-MOURISCO",
      sourcePage: "https://unsplash.com/photos/a-tree-with-red-berries-wg_9DiU1mSk",
      alt: {
        tr: "Gün ışığında olgun kırmızı meyveleriyle bir kahve ağacı",
        en: "A coffee tree with ripe red cherries in daylight",
      },
    },
    "firin-kruvasanlar": {
      source: "unsplash",
      url: unsplash("1498099916438-d96f52d0c7ff"),
      width: 5472,
      height: 3648,
      photographer: "Paul Hanaoka",
      sourcePage: "https://unsplash.com/photos/baked-croissants-93NV4sBJs_M",
      alt: {
        tr: "Beyaz tabakta fırından yeni çıkmış kruvasanlar",
        en: "Freshly baked croissants on a white plate",
      },
      focal: [45, 50],
    },
    "rehber-v60-filtre": {
      source: "unsplash",
      url: unsplash("1641962710751-390ae8ac104a"),
      width: 2832,
      height: 4240,
      photographer: "Yitzhak Rodriguez",
      sourcePage:
        "https://unsplash.com/photos/a-white-coffee-pot-filled-with-coffee-on-top-of-a-stove-xpPuaECmYX4",
      alt: {
        tr: "Kâğıt filtreli beyaz V60 hunisinde ıslak kahve yatağı, yakından",
        en: "A wet coffee bed in a white V60 dripper with a paper filter, close up",
      },
    },
    "rehber-v60-ciceklenme": {
      source: "unsplash",
      url: unsplash("1521677633993-721dd3f95c10"),
      width: 6240,
      height: 4160,
      photographer: "Devin Avery",
      sourcePage: "https://unsplash.com/photos/coffee-on-white-ceramic-mug-rwwMB7kTNes",
      alt: {
        tr: "Yukarıdan, terazi üzerindeki demleme hunisinde kabaran kahve",
        en: "From above, coffee blooming in a dripper on a scale",
      },
    },
    "rehber-v60-dokme": {
      source: "unsplash",
      url: unsplash("1586848384751-aa8f7ee302c7"),
      width: 3355,
      height: 4468,
      photographer: "Goran Ivos",
      sourcePage:
        "https://unsplash.com/photos/white-ceramic-teacup-on-white-ceramic-plate-K20IH6elzn8",
      alt: {
        tr: "Cam fincan üzerindeki V60 hunisine demlikten yavaşça su dökülüyor",
        en: "Water poured slowly from a kettle into a V60 on a glass cup",
      },
      focal: [45, 60],
    },
    "rehber-v60-tartim": {
      source: "unsplash",
      url: unsplash("1641962710748-3a97ca77804c"),
      width: 2832,
      height: 4240,
      photographer: "Yitzhak Rodriguez",
      sourcePage:
        "https://unsplash.com/photos/a-coffee-maker-sitting-on-top-of-a-table-next-to-a-cup-of-coffee-vAQzDaz92wE",
      alt: {
        tr: "Tezgâhta terazi üzerinde cam sürahili V60, arkada demlik",
        en: "A V60 on a glass server on a scale at the counter, kettle behind",
      },
      focal: [50, 55],
    },
    "rehber-chemex": {
      source: "unsplash",
      url: unsplash("1636836724015-62a2ecc5444f"),
      width: 4000,
      height: 6000,
      photographer: "Sama Hosseini",
      sourcePage:
        "https://unsplash.com/photos/a-coffee-pot-filled-with-liquid-on-top-of-a-white-plate-CW0NUGQB014",
      alt: {
        tr: "Beyaz tabla üzerinde demlenmiş kahveyle dolu Chemex",
        en: "A Chemex full of brewed coffee on a white tray",
      },
      focal: [50, 65],
    },
    "koken-guji-kiraz": {
      source: "unsplash",
      url: unsplash("1611330556082-0ba06d2780d0"),
      width: 4608,
      height: 3456,
      photographer: "Andres Hernandez",
      sourcePage: "https://unsplash.com/photos/red-and-green-cherry-fruit-fF9LOC5sMOQ",
      alt: {
        tr: "Dalda kırmızı ve yeşil kahve meyveleri, yakından",
        en: "Red and green coffee cherries on the branch, close up",
      },
    },
    "koken-huila-agac": {
      source: "unsplash",
      url: unsplash("1654815380393-58f66bdcb8bd"),
      width: 4597,
      height: 3065,
      photographer: "PROJETO CAFÉ GATO-MOURISCO",
      sourcePage: "https://unsplash.com/photos/a-tree-with-berries-khKOybgLbDw",
      alt: {
        tr: "Bir yamaçta olgun meyveleriyle kahve ağacı dalları",
        en: "Coffee branches heavy with ripe cherries on a hillside",
      },
    },
    "koken-nyeri-yikama": {
      source: "unsplash",
      url: unsplash("1786431851952-8526c4bf7ca7"),
      width: 5152,
      height: 7728,
      photographer: "Faris Ristiansyah",
      sourcePage: "https://unsplash.com/photos/coffee-cherries-in-wooden-tank-vnhz8fKYGUg",
      alt: {
        tr: "Ahşap su tankında bekleyen kırmızı kahve meyveleri",
        en: "Red coffee cherries soaking in a wooden water tank",
      },
      focal: [50, 45],
    },
  },

  optionGroups: {
    cekirdek: {
      name: { tr: "Çekirdek", en: "Bean" },
      min: 1,
      options: [
        {
          key: "guji",
          name: { tr: "Etiyopya Guji", en: "Ethiopia Guji" },
          default: true,
        },
        { key: "huila", name: { tr: "Kolombiya Huila", en: "Colombia Huila" } },
        { key: "nyeri", name: { tr: "Kenya Nyeri", en: "Kenya Nyeri" }, delta: "20" },
      ],
    },
    shot: {
      name: { tr: "Shot", en: "Shot" },
      min: 1,
      options: [
        { key: "tek", name: { tr: "Tek", en: "Single" } },
        { key: "cift", name: { tr: "Çift", en: "Double" }, delta: "35", default: true },
      ],
    },
    sut: {
      name: { tr: "Süt", en: "Milk" },
      min: 1,
      options: [
        {
          key: "inek",
          name: { tr: "İnek sütü", en: "Cow's milk" },
          allergens: ["milk"],
          default: true,
        },
        {
          key: "yulaf",
          name: { tr: "Yulaf sütü", en: "Oat milk" },
          delta: "25",
          allergens: ["gluten"],
        },
        {
          key: "badem",
          name: { tr: "Badem sütü", en: "Almond milk" },
          delta: "25",
          allergens: ["nuts"],
        },
        {
          key: "laktozsuz",
          name: { tr: "Laktozsuz süt", en: "Lactose-free milk" },
          delta: "15",
          allergens: ["milk"],
        },
      ],
    },
    surup: {
      name: { tr: "Şurup", en: "Syrup" },
      max: 1,
      options: [
        { key: "vanilya", name: { tr: "Vanilya", en: "Vanilla" }, delta: "20" },
        { key: "karamel", name: { tr: "Karamel", en: "Caramel" }, delta: "20" },
      ],
    },
  },

  rules: [],

  items: [
    // ── Sabah tabakları ────────────────────────────────────────────────────────────────────
    {
      slug: "eksi-maya-yumurta",
      name: { tr: "Ekşi mayada yumurta", en: "Egg on sourdough" },
      description: {
        tr: "Ekşi mayalı ekmekte sahanda yumurta, tereyağı ve pul biber.",
        en: "A fried egg on sourdough toast with butter and chilli flakes.",
      },
      ingredients: {
        tr: "Ekşi mayalı buğday ekmeği, yumurta, tereyağı, pul biber, tuz",
        en: "Wheat sourdough, egg, butter, chilli flakes, salt",
      },
      allergens: ["gluten", "eggs", "milk"],
      diets: ["vegetarian"],
      spiceLevel: 1,
      energyKcal: 390,
      portionG: 220,
      image: "eksi-maya-yumurta",
      prices: [{ amount: "260" }],
    },
    {
      slug: "avokadolu-ekmek",
      name: { tr: "Avokado ve beyaz peynir", en: "Avocado and white cheese" },
      description: {
        tr: "Ezilmiş avokado, ezine peyniri, domates ve limon; ekşi mayalı ekmekte.",
        en: "Smashed avocado, Ezine white cheese, tomato and lemon on sourdough.",
      },
      ingredients: {
        tr: "Ekşi mayalı buğday ekmeği, avokado, beyaz peynir, domates, limon, zeytinyağı, tuz",
        en: "Wheat sourdough, avocado, white cheese, tomato, lemon, olive oil, salt",
      },
      allergens: ["gluten", "milk"],
      diets: ["vegetarian"],
      energyKcal: 430,
      portionG: 240,
      image: "avokadolu-ekmek",
      prices: [{ amount: "290" }],
    },
    {
      slug: "domatesli-ekmek",
      name: { tr: "Domates ve labne", en: "Tomato and labneh" },
      description: {
        tr: "Kızarmış ekmekte labne, mevsim domatesi, közlenmiş biber ve kekik.",
        en: "Labneh, seasonal tomato, roasted pepper and thyme on toast.",
      },
      ingredients: {
        tr: "Ekşi mayalı buğday ekmeği, labne, domates, közlenmiş kırmızı biber, kekik, zeytinyağı",
        en: "Wheat sourdough, labneh, tomato, roasted red pepper, thyme, olive oil",
      },
      allergens: ["gluten", "milk"],
      diets: ["vegetarian"],
      spiceLevel: 1,
      energyKcal: 360,
      portionG: 230,
      image: "domatesli-ekmek",
      prices: [{ amount: "240" }],
    },
    {
      slug: "yogurt-granola",
      name: { tr: "Yoğurt ve granola", en: "Yoghurt and granola" },
      description: {
        tr: "Süzme yoğurt, ev yapımı granola, mevsim meyvesi ve bal.",
        en: "Strained yoghurt, house granola, seasonal fruit and honey.",
      },
      ingredients: {
        tr: "Süzme yoğurt, yulaf, fındık, bal, mevsim meyvesi, tarçın",
        en: "Strained yoghurt, oats, hazelnuts, honey, seasonal fruit, cinnamon",
      },
      allergens: ["milk", "gluten", "nuts"],
      diets: ["vegetarian"],
      energyKcal: 410,
      portionG: 250,
      prices: [{ amount: "210" }],
    },

    // ── Filtre ─────────────────────────────────────────────────────────────────────────────
    {
      slug: "gunun-filtresi",
      kind: "drink",
      name: { tr: "Günün filtresi · V60", en: "Filter of the day · V60" },
      description: {
        tr: "Bu hafta Etiyopya Guji: bergamot, şeftali ve bal; açık gövdeli, uzun bitiş. Çekirdeği siz de seçebilirsiniz.",
        en: "This week Ethiopia Guji: bergamot, peach and honey; light body, long finish. You can pick another bean.",
      },
      ingredients: { tr: "Filtre kahve, su", en: "Filter coffee, water" },
      energyKcal: 5,
      volumeMl: 250,
      image: "gunun-filtresi-v60",
      attributes: { brew: { method: "v60", doseG: 15, waterMl: 250, tempC: 93, timeS: 195 } },
      prices: [{ amount: "240" }],
      options: [{ group: "cekirdek" }],
      pairings: [{ item: "kruvasan", note: { tr: "Sabahın klasiği", en: "The morning classic" } }],
    },
    {
      slug: "chemex",
      kind: "drink",
      name: { tr: "Chemex · iki kişilik", en: "Chemex · for two" },
      description: {
        tr: "Kolombiya Huila ile: kırmızı elma ve karamel, yumuşak asidite.",
        en: "With Colombia Huila: red apple and caramel, soft acidity.",
      },
      ingredients: { tr: "Filtre kahve, su", en: "Filter coffee, water" },
      energyKcal: 10,
      volumeMl: 500,
      image: "chemex-iki-kisilik",
      attributes: { brew: { method: "chemex", doseG: 30, waterMl: 500, tempC: 94, timeS: 270 } },
      prices: [{ amount: "380" }],
      options: [{ group: "cekirdek" }],
    },
    {
      slug: "aeropress",
      kind: "drink",
      name: { tr: "AeroPress", en: "AeroPress" },
      description: {
        tr: "Kenya Nyeri ile: frenk üzümü ve greyfurt; parlak ve sulu.",
        en: "With Kenya Nyeri: blackcurrant and grapefruit; bright and juicy.",
      },
      ingredients: { tr: "Filtre kahve, su", en: "Filter coffee, water" },
      energyKcal: 5,
      volumeMl: 220,
      attributes: { brew: { method: "aeropress", doseG: 15, waterMl: 220, tempC: 85, timeS: 120 } },
      prices: [{ amount: "250" }],
    },
    {
      slug: "panama-geisha",
      kind: "drink",
      name: { tr: "Panama Geisha · V60", en: "Panama Geisha · V60" },
      description: {
        tr: "Sınırlı lot: yasemin, bergamot ve beyaz şeftali. Günde yalnızca on fincan.",
        en: "A limited lot: jasmine, bergamot and white peach. Only ten cups a day.",
      },
      ingredients: { tr: "Filtre kahve, su", en: "Filter coffee, water" },
      energyKcal: 5,
      volumeMl: 250,
      attributes: { brew: { method: "v60", doseG: 15, waterMl: 250, tempC: 92, timeS: 180 } },
      prices: [{ amount: "520" }],
      availability: { dailyLimit: 10 },
    },
    {
      slug: "demlik-kahve",
      kind: "drink",
      name: { tr: "Demlik kahve", en: "Batch brew" },
      description: {
        tr: "Ev harmanından hazır demleme; bir kez ücretsiz doldururuz.",
        en: "Ready-brewed from our house blend; one free refill.",
      },
      ingredients: { tr: "Filtre kahve, su", en: "Filter coffee, water" },
      energyKcal: 5,
      volumeMl: 300,
      image: "demlik-kahve",
      attributes: { brew: { method: "batch", doseG: 18, waterMl: 300, tempC: 94 } },
      prices: [{ amount: "190" }],
    },

    // ── Espresso ───────────────────────────────────────────────────────────────────────────
    {
      slug: "espresso",
      kind: "drink",
      name: { tr: "Espresso", en: "Espresso" },
      description: {
        tr: "Rakım harmanı: kakao, fındık ve kurutulmuş kiraz.",
        en: "Rakım blend: cocoa, hazelnut and dried cherry.",
      },
      ingredients: { tr: "Espresso", en: "Espresso" },
      energyKcal: 2,
      volumeMl: 40,
      image: "espresso-fincan",
      attributes: { brew: { method: "espresso", doseG: 18, yieldG: 36, tempC: 93, timeS: 28 } },
      prices: [{ amount: "150" }],
      options: [{ group: "shot" }],
    },
    {
      slug: "americano",
      kind: "drink",
      name: { tr: "Americano", en: "Americano" },
      description: {
        tr: "Çift espresso ve sıcak su; sade ve uzun.",
        en: "A double espresso and hot water; plain and long.",
      },
      ingredients: { tr: "Espresso, su", en: "Espresso, water" },
      energyKcal: 5,
      volumeMl: 300,
      image: "americano-ustten",
      prices: [{ amount: "180" }],
    },
    {
      slug: "cortado",
      kind: "drink",
      name: { tr: "Cortado", en: "Cortado" },
      description: {
        tr: "Eşit oranda espresso ve sıcak süt.",
        en: "Espresso and warm milk in equal parts.",
      },
      ingredients: { tr: "Espresso, süt", en: "Espresso, milk" },
      energyKcal: 50,
      volumeMl: 120,
      image: "cortado-cam",
      prices: [{ amount: "190" }],
      options: [{ group: "sut" }],
    },
    {
      slug: "flat-white",
      kind: "drink",
      name: { tr: "Flat white", en: "Flat white" },
      description: {
        tr: "Çift ristretto ve ince köpüklü süt.",
        en: "A double ristretto with finely textured milk.",
      },
      ingredients: { tr: "Espresso, süt", en: "Espresso, milk" },
      energyKcal: 110,
      volumeMl: 180,
      image: "flat-white-mermer",
      prices: [{ amount: "230" }],
      options: [{ group: "sut" }],
    },
    {
      slug: "latte",
      kind: "drink",
      name: { tr: "Latte", en: "Latte" },
      description: {
        tr: "Boyu, sütü, shot sayısı ve şurubu sizin seçiminiz.",
        en: "Your size, your milk, your shots, your syrup.",
      },
      ingredients: {
        tr: "Espresso, süt; seçime göre şurup",
        en: "Espresso, milk; syrup as chosen",
      },
      energyKcal: 160,
      volumeMl: 240,
      image: "latte-yaprak",
      prices: [
        { key: "8oz", unit: "size", label: { tr: "8 oz", en: "8 oz" }, amount: "240" },
        { key: "12oz", unit: "size", label: { tr: "12 oz", en: "12 oz" }, amount: "275" },
      ],
      options: [{ group: "shot" }, { group: "sut" }, { group: "surup" }],
    },
    {
      slug: "cappuccino",
      kind: "drink",
      name: { tr: "Cappuccino", en: "Cappuccino" },
      description: {
        tr: "Espresso, sıcak süt ve kalın köpük.",
        en: "Espresso, warm milk and a deep foam.",
      },
      ingredients: { tr: "Espresso, süt", en: "Espresso, milk" },
      energyKcal: 120,
      volumeMl: 200,
      image: "cappuccino-ustten",
      prices: [{ amount: "225" }],
      options: [{ group: "sut" }],
    },

    // ── Soğuk ──────────────────────────────────────────────────────────────────────────────
    {
      slug: "espresso-tonik",
      kind: "drink",
      name: { tr: "Espresso tonik", en: "Espresso tonic" },
      description: {
        tr: "Buz, tonik ve üstüne çift espresso; bir dilim portakalla.",
        en: "Ice and tonic topped with a double espresso, with a slice of orange.",
      },
      ingredients: {
        tr: "Espresso, tonik (şeker, kinin), buz, portakal",
        en: "Espresso, tonic (sugar, quinine), ice, orange",
      },
      energyKcal: 70,
      volumeMl: 250,
      image: "espresso-tonik",
      prices: [{ amount: "250" }],
    },
    {
      slug: "buzlu-latte",
      kind: "drink",
      name: { tr: "Buzlu latte", en: "Iced latte" },
      description: {
        tr: "Buz, soğuk süt ve çift espresso.",
        en: "Ice, cold milk and a double espresso.",
      },
      ingredients: { tr: "Espresso, süt, buz", en: "Espresso, milk, ice" },
      energyKcal: 140,
      volumeMl: 300,
      image: "buzlu-latte",
      prices: [{ amount: "250" }],
      options: [{ group: "sut" }, { group: "surup" }],
    },
    {
      slug: "soguk-demleme",
      kind: "drink",
      name: { tr: "Soğuk demleme", en: "Cold brew" },
      description: {
        tr: "Ruanda çekirdeği on altı saat soğuk suda; buzla.",
        en: "Rwandan coffee steeped sixteen hours in cold water; over ice.",
      },
      ingredients: { tr: "Kahve, su, buz", en: "Coffee, water, ice" },
      energyKcal: 5,
      volumeMl: 300,
      image: "soguk-demleme",
      attributes: { brew: { method: "cold_brew", doseG: 40, waterMl: 320 } },
      prices: [{ amount: "230" }],
      availability: { seasons: [{ from: 4, to: 10 }], outsideSeason: "dim" },
    },

    // ── Fırından ───────────────────────────────────────────────────────────────────────────
    {
      slug: "kruvasan",
      name: { tr: "Tereyağlı kruvasan", en: "Butter croissant" },
      description: {
        tr: "Moda Ekşi Maya'dan; her sabah iki kez fırından çıkar.",
        en: "From Moda Ekşi Maya; out of the oven twice every morning.",
      },
      ingredients: {
        tr: "Buğday unu, tereyağı, süt, şeker, maya, yumurta, tuz",
        en: "Wheat flour, butter, milk, sugar, yeast, egg, salt",
      },
      allergens: ["gluten", "milk", "eggs"],
      diets: ["vegetarian"],
      energyKcal: 290,
      portionG: 70,
      image: "kruvasan-tabak",
      prices: [{ amount: "140" }],
      availability: { releaseTimes: ["08:00", "11:00"] },
    },
    {
      slug: "tarcinli-corek",
      name: { tr: "Tarçınlı çörek", en: "Cinnamon roll" },
      description: {
        tr: "Kakule ve tarçınlı hamur, üstünde krem peynirli şekerleme.",
        en: "Cardamom and cinnamon dough with a cream cheese glaze.",
      },
      ingredients: {
        tr: "Buğday unu, tereyağı, süt, şeker, tarçın, kakule, krem peynir, maya, yumurta",
        en: "Wheat flour, butter, milk, sugar, cinnamon, cardamom, cream cheese, yeast, egg",
      },
      allergens: ["gluten", "milk", "eggs"],
      diets: ["vegetarian"],
      energyKcal: 420,
      portionG: 110,
      image: "tarcinli-corek",
      prices: [{ amount: "160" }],
      availability: { releaseTimes: ["10:00"], dailyLimit: 20 },
    },
    {
      slug: "findikli-kurabiye",
      name: { tr: "Fındıklı kurabiye", en: "Hazelnut cookie" },
      description: {
        tr: "Esmer şeker, Giresun fındığı ve bitter çikolata parçaları.",
        en: "Brown sugar, Giresun hazelnuts and dark chocolate chunks.",
      },
      ingredients: {
        tr: "Buğday unu, tereyağı, esmer şeker, fındık, bitter çikolata, yumurta, tuz",
        en: "Wheat flour, butter, brown sugar, hazelnuts, dark chocolate, egg, salt",
      },
      allergens: ["gluten", "milk", "eggs", "nuts", "soy"],
      diets: ["vegetarian"],
      energyKcal: 230,
      portionG: 50,
      prices: [{ amount: "90" }],
    },
    {
      slug: "muzlu-kek",
      name: { tr: "Muzlu kek", en: "Banana bread" },
      description: {
        tr: "Olgun muz ve ceviz; dilim halinde, ılık servis.",
        en: "Ripe banana and walnut; by the slice, served warm.",
      },
      ingredients: {
        tr: "Muz, buğday unu, esmer şeker, ceviz, yumurta, ayçiçek yağı, kabartma tozu",
        en: "Banana, wheat flour, brown sugar, walnuts, egg, sunflower oil, baking powder",
      },
      allergens: ["gluten", "eggs", "nuts"],
      diets: ["vegetarian"],
      energyKcal: 310,
      portionG: 90,
      prices: [{ amount: "130" }],
    },

    // ── Çekirdekler ───────────────────────────────────────────────────────────────────────
    {
      slug: "etiyopya-guji",
      kind: "bean",
      name: { tr: "Etiyopya Guji", en: "Ethiopia Guji" },
      description: {
        tr: "Kooperatif lotu; yıkanmış işleme. Filtre için açık kavrum.",
        en: "A cooperative lot, washed. A light roast for filter.",
      },
      ingredients: { tr: "%100 arabica kahve çekirdeği", en: "100% arabica coffee beans" },
      origin: { tr: "Etiyopya", en: "Ethiopia" },
      image: "cekirdek-guji",
      attributes: {
        region: "Guji, Oromia",
        altitude: { min: 1950, max: 2200 },
        process: "washed",
        varieties: ["Heirloom"],
        notes: [
          { tr: "bergamot", en: "bergamot" },
          { tr: "şeftali", en: "peach" },
          { tr: "bal", en: "honey" },
        ],
        roast: "filter",
        weightG: 250,
      },
      prices: [{ amount: "980" }],
    },
    {
      slug: "kolombiya-huila",
      kind: "bean",
      name: { tr: "Kolombiya Huila", en: "Colombia Huila" },
      description: {
        tr: "Küçük üreticilerden; yıkanmış. Hem filtre hem espresso için.",
        en: "From smallholders, washed. For filter and espresso alike.",
      },
      ingredients: { tr: "%100 arabica kahve çekirdeği", en: "100% arabica coffee beans" },
      origin: { tr: "Kolombiya", en: "Colombia" },
      image: "cekirdek-huila",
      attributes: {
        region: "Huila",
        altitude: { min: 1700, max: 1900 },
        process: "washed",
        varieties: ["Caturra", "Castillo"],
        notes: [
          { tr: "kırmızı elma", en: "red apple" },
          { tr: "karamel", en: "caramel" },
          { tr: "sütlü çikolata", en: "milk chocolate" },
        ],
        roast: "omni",
        weightG: 250,
      },
      prices: [{ amount: "890" }],
    },
    {
      slug: "kenya-nyeri",
      kind: "bean",
      name: { tr: "Kenya Nyeri", en: "Kenya Nyeri" },
      description: {
        tr: "Yıkama istasyonu lotu; AA boy. Parlak ve sulu bir filtre kahvesi.",
        en: "A washing station lot, AA grade. A bright, juicy filter coffee.",
      },
      ingredients: { tr: "%100 arabica kahve çekirdeği", en: "100% arabica coffee beans" },
      origin: { tr: "Kenya", en: "Kenya" },
      image: "cekirdek-nyeri",
      attributes: {
        region: "Nyeri",
        altitude: { min: 1750, max: 1900 },
        process: "washed",
        varieties: ["SL28", "SL34"],
        notes: [
          { tr: "frenk üzümü", en: "blackcurrant" },
          { tr: "greyfurt", en: "grapefruit" },
          { tr: "esmer şeker", en: "brown sugar" },
        ],
        roast: "filter",
        weightG: 250,
      },
      prices: [{ amount: "1.050" }],
    },
    {
      slug: "rakim-harmani",
      kind: "bean",
      name: { tr: "Rakım harmanı", en: "Rakım blend" },
      description: {
        tr: "Brezilya ve Kolombiya; espresso için orta kavrum. Barda kullandığımız çekirdek.",
        en: "Brazil and Colombia; a medium roast for espresso. The coffee in our grinder.",
      },
      ingredients: { tr: "%100 arabica kahve çekirdeği", en: "100% arabica coffee beans" },
      origin: { tr: "Brezilya, Kolombiya", en: "Brazil, Colombia" },
      image: "cekirdek-harman",
      attributes: {
        region: "Cerrado Mineiro · Huila",
        altitude: { min: 1100, max: 1800 },
        process: "natural",
        varieties: ["Yellow Catuaí", "Caturra"],
        notes: [
          { tr: "kakao", en: "cocoa" },
          { tr: "fındık", en: "hazelnut" },
          { tr: "kurutulmuş kiraz", en: "dried cherry" },
        ],
        roast: "espresso",
        weightG: 250,
      },
      prices: [{ amount: "820" }],
    },
  ],

  menus: [
    // Gün boyu first: the clock moves open menus before closed ones (useActiveMenus); with the
    // all-day menu first, that order never changes after hydration (no layout shift, CLS 0).
    // Bringing Sabah forward in the morning before the first paint is D-17's signature.
    {
      slug: "gun-boyu",
      name: { tr: "Gün boyu", en: "All day" },
      sections: [
        {
          name: { tr: "Filtre", en: "Filter" },
          items: [
            { item: "gunun-filtresi", featured: true },
            "chemex",
            "aeropress",
            "panama-geisha",
            "demlik-kahve",
          ],
        },
        {
          name: { tr: "Espresso", en: "Espresso" },
          items: ["espresso", "americano", "cortado", "flat-white", "latte", "cappuccino"],
        },
        {
          name: { tr: "Soğuk", en: "Cold" },
          items: ["espresso-tonik", "buzlu-latte", "soguk-demleme"],
        },
        {
          name: { tr: "Fırından", en: "From the oven" },
          items: ["kruvasan", "tarcinli-corek", "findikli-kurabiye", "muzlu-kek"],
        },
        {
          name: { tr: "Çekirdekler", en: "Beans" },
          items: ["etiyopya-guji", "kolombiya-huila", "kenya-nyeri", "rakim-harmani"],
        },
      ],
    },
    {
      slug: "sabah",
      kind: "breakfast",
      name: { tr: "Sabah", en: "Morning" },
      schedule: { windows: [{ start: "08:00", end: "12:00" }] },
      sections: [
        {
          name: { tr: "Sabah tabakları", en: "Morning plates" },
          items: ["eksi-maya-yumurta", "avokadolu-ekmek", "domatesli-ekmek", "yogurt-granola"],
        },
      ],
    },
  ],
});
