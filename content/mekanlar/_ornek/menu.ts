import { defineMenuContent } from "../../../src/platform/menu/content";

/**
 * Test fixture menu (D-04): a small, fictional esnaf lokantası on the ready-made theme Sade, in
 * Turkish, English and Arabic. Never in the production build (fixture: true). Edge cases on
 * purpose: half portions, a sub-section, one Arabic description missing (falls back to Turkish,
 * BR-MNU-003), products without a photo (K-23), a time-limited breakfast menu, a draft product.
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
  },

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
      slug: "cortado",
      kind: "drink",
      name: { tr: "Cortado", en: "Cortado", ar: "كورتادو" },
      ingredients: { tr: "Espresso, süt", en: "Espresso, milk", ar: "إسبريسو، حليب" },
      allergens: ["milk"],
      energyKcal: 45,
      volumeMl: 120,
      image: "cortado-cam-bardak",
      prices: [{ amount: "140" }],
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
      ],
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
        { name: { tr: "İçecekler", en: "Drinks", ar: "مشروبات" }, items: ["cay", "cortado"] },
      ],
    },
  ],
});
