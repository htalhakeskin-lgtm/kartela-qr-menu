/**
 * Fixed value sets of the menu engine (plan §9, REQ-005). Plain module: the database schema imports it
 * for its check constraints, the themes for their labels (D-08 moves labels into the i18n
 * dictionaries).
 *
 * The 14 allergens are the ones Turkish food labelling (Türk Gıda Kodeksi Gıda Etiketleme ve
 * Tüketicileri Bilgilendirme Yönetmeliği, Ek-1) and EU 1169/2011 Annex II name.
 */
export const ALLERGENS = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soy",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

/** Diet marks a product can carry; an option may remove one (D-05: diets_removed). */
export const DIETS = ["vegan", "vegetarian", "gluten_free", "lactose_free", "halal"] as const;
export type Diet = (typeof DIETS)[number];

/** 0 = not spicy … 3 = very spicy. */
export const SPICE_LEVELS = [0, 1, 2, 3] as const;
export type SpiceLevel = (typeof SPICE_LEVELS)[number];

/** Product kinds the engine knows; attributes are validated per kind (D-04 content schema). */
export const ITEM_KINDS = ["dish", "drink", "bean", "set", "tasting"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/** Menu kinds (plan §9). A password-protected menu is `access: password`, not a kind (D-37). */
export const MENU_KINDS = [
  "all_day",
  "breakfast",
  "lunch",
  "evening",
  "night",
  "daily",
  "tasting",
  "drinks",
] as const;
export type MenuKind = (typeof MENU_KINDS)[number];

export const ITEM_STATUSES = ["draft", "published", "archived"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** Keşfet story kinds (plan §9, D-07): chapter and guide are numbered stops of a collection. */
export const STORY_KINDS = ["item_story", "chef_note", "supplier", "chapter", "guide"] as const;
export type StoryKind = (typeof STORY_KINDS)[number];
