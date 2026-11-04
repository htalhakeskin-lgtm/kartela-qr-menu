import { defineMenuContent } from "../../../src/platform/menu/content";

/**
 * Test fixture menu (D-04): a small, fictional esnaf lokantası on the ready-made theme Sade, in
 * Turkish, English and Arabic. Never in the production build (fixture: true). Edge cases on
 * purpose: half portions, a sub-section, one Arabic description missing (falls back to Turkish,
 * BR-MNU-003), products without a photo (K-23), a time-limited breakfast menu, a draft product,
 * the configurator (D-05): a required choice without a default (sugar), a milk choice, extras
 * offered only on the double shot, a sold-out extra and an incompatible pair (oat milk ↔ cream);
 * and D-06: a product sold out until further notice, a dessert whose daily count ran out today,
 * bake times, a winter-only drink, a pairing, a suggestion, a set, a tasting menu and a two-week
 * menu of the day with Sunday closed.
 *
 * Every published product carries ingredients and energy (REQ-005). Figures are estimates for a
 * typical portion, not lab values. The one photo is registered in docs/gorsel-kaynaklari.md.
 */
export default defineMenuContent({
  images: {
    "cortado-cam-bardak": {
      source: "unsplash",
      url: "https://images.unsplash.com/photo-1610889556528-9a770e32642f",
      width: 7170,
      height: 4100,
      photographer: "Adi Goldstein",
      sourcePage: "https://unsplash.com/photos/clear-glass-cup-on-saucer-xKS-1DP4g7A",
      alt: {
        tr: "Beyaz zeminde tabak üzerinde cam bardakta cortado",
        en: "Cortado in a glass on a saucer, white background",
        ar: "كورتادو في كوب زجاجي على صحن، خلفية بيضاء",
      },
      focal: [50, 55],
    },
    "fincan-sade-kahve": {
      source: "unsplash",
      url: "https://images.unsplash.com/photo-1493606278519-11aa9f86e40a",
      width: 2442,
      height: 1628,
      photographer: "Isaac Benhesed",
      sourcePage: "https://unsplash.com/photos/onLbXleIkds",
      alt: {
        tr: "Beyaz masada yukarıdan çekilmiş beyaz fincanda sade kahve",
        en: "Black coffee in a white cup on a white table, from above",
      },
    },
  },

  optionGroups: {
    seker: {
      name: { tr: "Şeker", en: "Sugar", ar: "السكر" },
      min: 1,
      options: [
        { key: "sade", name: { tr: "Sade", en: "No sugar", ar: "بدون سكر" } },
        { key: "az", name: { tr: "Az şekerli", en: "A little sugar", ar: "سكر قليل" } },
        { key: "orta", name: { tr: "Orta", en: "Medium", ar: "متوسط" } },
        { key: "sekerli", name: { tr: "Şekerli", en: "Sweet", ar: "سكر كثير" } },
      ],
    },
    sut: {
      name: { tr: "Süt", en: "Milk", ar: "الحليب" },
      min: 1,
      options: [
        {
          key: "inek",
          name: { tr: "İnek sütü", en: "Cow's milk", ar: "حليب البقر" },
          allergens: ["milk"],
          default: true,
        },
        {
          key: "yulaf",
          name: { tr: "Yulaf sütü", en: "Oat milk", ar: "حليب الشوفان" },
          delta: "20",
          allergens: ["gluten"],
        },
        {
          key: "laktozsuz",
          name: { tr: "Laktozsuz süt", en: "Lactose-free milk", ar: "حليب خالٍ من اللاكتوز" },
          delta: "15",
          allergens: ["milk"],
        },
      ],
    },
    ekstra: {
      name: { tr: "Ekstra", en: "Extras", ar: "إضافات" },
      max: 2,
      options: [
        { key: "tarcin", name: { tr: "Tarçın", en: "Cinnamon", ar: "قرفة" }, delta: "10" },
        {
          key: "krema",
          name: { tr: "Krema", en: "Whipped cream", ar: "كريمة" },
          delta: "15",
          allergens: ["milk"],
        },
        { key: "bal", name: { tr: "Bal", en: "Honey", ar: "عسل" }, delta: "10", available: false },
      ],
    },
  },

  rules: [
    {
      when: "sut.yulaf",
      excludes: "ekstra.krema",
      message: { tr: "Yulaf sütüyle krema eklenmez.", en: "No whipped cream with oat milk." },
    },
  ],

  items: [
    {
      slug: "mercimek-corbasi",
      name: { tr: "Mercimek çorbası", en: "Red lentil soup", ar: "شوربة العدس" },
      description: {
        tr: "Kırmızı mercimek, havuç ve soğan; tereyağında kırmızı biberle.",
        en: "Red lentils, carrot and onion, finished with paprika butter.",
        ar: "عدس أحمر وجزر وبصل مع زبدة بالفلفل الأحمر.",
      },
      ingredients: {
        tr: "Kırmızı mercimek, havuç, kuru soğan, tereyağı, un, pul biber, tuz",
        en: "Red lentils, carrot, onion, butter, wheat flour, chilli flakes, salt",
        ar: "عدس أحمر، جزر، بصل، زبدة، دقيق القمح، فلفل أحمر، ملح",
      },
      allergens: ["milk", "gluten"],
      diets: ["vegetarian"],
      energyKcal: 210,
      portionG: 300,
      prices: [{ amount: "120" }],
      suggestions: ["ezogelin-corbasi"],
    },
    {
      slug: "ezogelin-corbasi",
      name: { tr: "Ezogelin çorbası", en: "Ezogelin soup", ar: "شوربة إيزوجلين" },
      description: {
        tr: "Mercimek, bulgur ve pirinç; nane ve kırmızı biberle.",
        en: "Lentils, bulgur and rice with mint and paprika.",
      },
      ingredients: {
        tr: "Kırmızı mercimek, bulgur, pirinç, domates salçası, tereyağı, kuru nane, pul biber",
        en: "Red lentils, bulgur, rice, tomato paste, butter, dried mint, chilli flakes",
      },
      allergens: ["gluten", "milk"],
      diets: ["vegetarian"],
      spiceLevel: 1,
      energyKcal: 230,
      portionG: 300,
      prices: [{ amount: "120" }],
    },
    {
      slug: "zeytinyagli-kuru-fasulye",
      name: {
        tr: "Zeytinyağlı kuru fasulye",
        en: "White beans in olive oil",
        ar: "فاصوليا بيضاء بزيت الزيتون",
      },
      ingredients: {
        tr: "Kuru fasulye, zeytinyağı, kuru soğan, domates, biber salçası, tuz",
        en: "Dried white beans, olive oil, onion, tomato, pepper paste, salt",
        ar: "فاصوليا بيضاء، زيت زيتون، بصل، طماطم، معجون الفلفل، ملح",
      },
      diets: ["vegan"],
      energyKcal: 340,
      portionG: 350,
      prices: [{ amount: "220" }, { unit: "half", amount: "140" }],
      pairings: [
        {
          item: "pirinc-pilavi",
          note: { tr: "Klasik ikili", en: "The classic pair", ar: "الثنائي الكلاسيكي" },
        },
      ],
    },
    {
      slug: "etli-nohut",
      name: { tr: "Etli nohut", en: "Chickpeas with lamb", ar: "حمص باللحم" },
      ingredients: {
        tr: "Nohut, kuzu eti, kuru soğan, domates salçası, tereyağı, tuz",
        en: "Chickpeas, lamb, onion, tomato paste, butter, salt",
        ar: "حمص، لحم ضأن، بصل، معجون الطماطم، زبدة، ملح",
      },
      allergens: ["milk"],
      energyKcal: 480,
      portionG: 350,
      prices: [{ amount: "260" }, { unit: "half", amount: "170" }],
      availability: { soldOut: "indefinite" },
    },
    {
      slug: "pirinc-pilavi",
      name: { tr: "Pirinç pilavı", en: "Rice pilaf", ar: "أرز بالشعيرية" },
      ingredients: {
        tr: "Baldo pirinç, arpa şehriye, tereyağı, tavuk suyu, tuz",
        en: "Baldo rice, orzo, butter, chicken stock, salt",
        ar: "أرز، شعيرية، زبدة، مرق الدجاج، ملح",
      },
      allergens: ["gluten", "milk"],
      energyKcal: 290,
      portionG: 200,
      prices: [{ amount: "90" }],
    },
    {
      slug: "sutlac",
      name: { tr: "Fırın sütlaç", en: "Baked rice pudding", ar: "أرز بالحليب في الفرن" },
      ingredients: {
        tr: "Süt, pirinç, şeker, pirinç unu, vanilya",
        en: "Milk, rice, sugar, rice flour, vanilla",
        ar: "حليب، أرز، سكر، دقيق الأرز، فانيليا",
      },
      allergens: ["milk"],
      diets: ["vegetarian", "gluten_free"],
      energyKcal: 260,
      portionG: 200,
      prices: [{ amount: "110" }],
      availability: { releaseTimes: ["11:30", "16:00"] },
    },
    {
      slug: "irmik-helvasi",
      name: { tr: "İrmik helvası", en: "Semolina halva", ar: "حلاوة السميد" },
      ingredients: {
        tr: "İrmik, tereyağı, süt, şeker, çam fıstığı",
        en: "Semolina, butter, milk, sugar, pine nuts",
        ar: "سميد، زبدة، حليب، سكر، صنوبر",
      },
      allergens: ["gluten", "milk", "nuts"],
      diets: ["vegetarian"],
      energyKcal: 380,
      portionG: 150,
      prices: [{ amount: "100" }],
      availability: { dailyLimit: 10, remainingToday: 0 },
    },
    {
      slug: "menemen",
      name: { tr: "Menemen", en: "Menemen (eggs with tomato and pepper)", ar: "منمن" },
      ingredients: {
        tr: "Yumurta, domates, sivri biber, tereyağı, tuz",
        en: "Eggs, tomato, green pepper, butter, salt",
        ar: "بيض، طماطم، فلفل أخضر، زبدة، ملح",
      },
      allergens: ["eggs", "milk"],
      diets: ["vegetarian", "gluten_free"],
      energyKcal: 320,
      portionG: 250,
      prices: [{ amount: "180" }],
    },
    {
      slug: "cay",
      kind: "drink",
      name: { tr: "Çay", en: "Turkish tea", ar: "شاي تركي" },
      ingredients: { tr: "Siyah çay, su", en: "Black tea, water", ar: "شاي أسود، ماء" },
      energyKcal: 2,
      volumeMl: 100,
      prices: [{ amount: "30" }],
    },
    {
      slug: "turk-kahvesi",
      kind: "drink",
      name: { tr: "Türk kahvesi", en: "Turkish coffee", ar: "قهوة تركية" },
      ingredients: {
        tr: "Türk kahvesi, su; şeker seçime göre",
        en: "Turkish coffee, water; sugar as chosen",
        ar: "قهوة تركية، ماء؛ السكر حسب الاختيار",
      },
      energyKcal: 10,
      volumeMl: 70,
      prices: [{ amount: "90" }],
      options: [{ group: "seker" }],
    },
    {
      slug: "cortado",
      kind: "drink",
      name: { tr: "Cortado", en: "Cortado", ar: "كورتادو" },
      ingredients: { tr: "Espresso, süt", en: "Espresso, milk", ar: "إسبريسو، حليب" },
      energyKcal: 45,
      volumeMl: 120,
      image: "cortado-cam-bardak",
      prices: [
        {
          key: "tek",
          unit: "size",
          label: { tr: "Tek shot", en: "Single", ar: "جرعة واحدة" },
          amount: "140",
        },
        {
          key: "cift",
          unit: "size",
          label: { tr: "Çift shot", en: "Double", ar: "جرعتان" },
          amount: "170",
        },
      ],
      options: [{ group: "sut" }, { group: "ekstra", appliesTo: ["cift"] }],
    },
    {
      slug: "salep",
      kind: "drink",
      name: { tr: "Salep", en: "Salep", ar: "سحلب" },
      ingredients: {
        tr: "Süt, salep, şeker, tarçın",
        en: "Milk, salep, sugar, cinnamon",
        ar: "حليب، سحلب، سكر، قرفة",
      },
      allergens: ["milk"],
      diets: ["vegetarian", "gluten_free"],
      energyKcal: 220,
      volumeMl: 200,
      prices: [{ amount: "110" }],
      availability: { seasons: [{ from: 10, to: 3 }] },
    },
    {
      slug: "esnaf-tabagi",
      kind: "set",
      name: { tr: "Esnaf tabağı", en: "Tradesman's plate", ar: "طبق الحرفيين" },
      description: {
        tr: "Zeytinyağlı kuru fasulye, pirinç pilavı ve bir çay.",
        en: "White beans in olive oil, rice pilaf and a tea.",
        ar: "فاصوليا بيضاء بزيت الزيتون وأرز وشاي.",
      },
      ingredients: {
        tr: "Kuru fasulye, zeytinyağı, soğan, domates, pirinç, arpa şehriye, tereyağı, siyah çay",
        en: "White beans, olive oil, onion, tomato, rice, orzo, butter, black tea",
        ar: "فاصوليا بيضاء، زيت زيتون، بصل، طماطم، أرز، شعيرية، زبدة، شاي أسود",
      },
      allergens: ["gluten", "milk"],
      energyKcal: 632,
      prices: [{ amount: "330" }],
      components: [
        { item: "zeytinyagli-kuru-fasulye" },
        { item: "pirinc-pilavi" },
        { item: "cay" },
      ],
    },
    {
      slug: "lokanta-tadimi",
      kind: "tasting",
      name: { tr: "Lokanta tadımı", en: "Lokanta tasting", ar: "تذوق اللوكانتا" },
      description: {
        tr: "Üç tabakta günün lokantası: çorba, sulu yemek, tatlı.",
        en: "The lokanta in three small plates: soup, stew, dessert.",
      },
      prices: [{ amount: "450" }],
      courses: [
        { title: { tr: "Çorba", en: "Soup", ar: "شوربة" }, item: "mercimek-corbasi" },
        {
          title: { tr: "Sulu yemek", en: "Stew", ar: "طبق مطبوخ" },
          item: "zeytinyagli-kuru-fasulye",
        },
        {
          title: { tr: "Tatlı", en: "Dessert", ar: "حلوى" },
          item: "sutlac",
          description: { tr: "Fırından yeni çıkmış, ılık.", en: "Warm, fresh from the oven." },
        },
      ],
    },
    {
      slug: "gunun-tatlisi-taslak",
      status: "draft",
      name: { tr: "Günün tatlısı (taslak)" },
      prices: [{ amount: "120" }],
    },
  ],

  menus: [
    {
      slug: "gunun-yemekleri",
      name: { tr: "Günün yemekleri", en: "Today's dishes", ar: "أطباق اليوم" },
      sections: [
        {
          name: { tr: "Çorbalar", en: "Soups", ar: "شوربات" },
          items: ["mercimek-corbasi", "ezogelin-corbasi"],
        },
        {
          name: { tr: "Sulu yemekler", en: "Stews", ar: "أطباق مطبوخة" },
          items: [
            { item: "zeytinyagli-kuru-fasulye", featured: true },
            "etli-nohut",
            "pirinc-pilavi",
          ],
        },
        {
          name: { tr: "Tatlılar", en: "Desserts", ar: "حلويات" },
          items: ["irmik-helvasi", "gunun-tatlisi-taslak"],
          children: [
            {
              name: { tr: "Sütlü tatlılar", en: "Milk puddings", ar: "حلويات بالحليب" },
              items: ["sutlac"],
            },
          ],
        },
        {
          name: { tr: "Tabaklar", en: "Plates", ar: "أطباق" },
          items: ["esnaf-tabagi", "lokanta-tadimi"],
        },
      ],
    },
    {
      slug: "gunun-menusu",
      kind: "daily",
      name: { tr: "Günün menüsü", en: "Menu of the day", ar: "قائمة اليوم" },
      // Sunday has no list: the lokanta is closed (an empty daily menu, BR-MST-005).
      daily: {
        weekdays: {
          "1": ["mercimek-corbasi", "zeytinyagli-kuru-fasulye", "pirinc-pilavi", "sutlac"],
          "2": ["ezogelin-corbasi", "etli-nohut", "pirinc-pilavi", "irmik-helvasi"],
          "3": ["mercimek-corbasi", "zeytinyagli-kuru-fasulye", "pirinc-pilavi", "irmik-helvasi"],
          "4": ["ezogelin-corbasi", "etli-nohut", "pirinc-pilavi", "sutlac"],
          "5": ["mercimek-corbasi", "zeytinyagli-kuru-fasulye", "pirinc-pilavi", "sutlac"],
          "6": ["ezogelin-corbasi", "menemen", "irmik-helvasi"],
        },
        days: 14,
      },
    },
    {
      slug: "kahvalti",
      kind: "breakfast",
      name: { tr: "Kahvaltı", en: "Breakfast", ar: "فطور" },
      schedule: { windows: [{ start: "07:00", end: "11:00" }] },
      sections: [
        {
          name: { tr: "Kahvaltılık", en: "Breakfast plates", ar: "أطباق الفطور" },
          items: ["menemen"],
        },
        {
          name: { tr: "İçecekler", en: "Drinks", ar: "مشروبات" },
          items: ["cay", "turk-kahvesi", "cortado", "salep"],
        },
      ],
    },
  ],
});
