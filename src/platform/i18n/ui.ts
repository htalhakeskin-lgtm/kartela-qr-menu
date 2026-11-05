import type { Allergen, Diet } from "../menu/vocabulary";
import type { Locale } from "../tenant/registry-schema";

/**
 * Interface texts of the venue sites (plan K-08: no next-intl; content translations live in the
 * data). One typed dictionary per language; a missing language falls back to English, then
 * Turkish. Client components receive the dictionary as a prop, never the whole set.
 */
export type UiText = {
  menu: string;
  quick: string;
  explore: string;
  search: string;
  searchPlaceholder: string;
  filter: string;
  picks: string;
  info: string;
  close: string;
  categories: string;
  languages: string;
  noResults: string;
  noFilterResults: string;
  clearFilters: string;
  diets: string;
  excludeAllergens: string;
  maxSpice: string;
  anySpice: string;
  showResults: (count: number) => string;
  addToPicks: string;
  added: string;
  soldOut: string;
  remainingToday: (count: number) => string;
  nextRelease: (time: string, tomorrow: boolean) => string;
  inSeason: string;
  startsAt: (time: string) => string;
  closedNow: string;
  allergens: string;
  mayContain: string;
  ingredients: string;
  energy: string;
  portion: string;
  origin: string;
  spice: string;
  askStaff: string;
  goesWith: string;
  contains: string;
  courses: string;
  featured: string;
  required: string;
  chooseUpTo: (max: number) => string;
  chooseExactly: (count: number) => string;
  optional: string;
  unavailable: string;
  vatIncluded: string;
  noServiceCharge: string;
  printedList: string;
  allergenStatement: string;
  demoNote: string;
  stories: string;
  goToItem: string;
  showWaiter: string;
  waiterTitle: string;
  total: string;
  backToList: string;
  emptyPicks: string;
  colour: string;
  colourLight: string;
  colourDark: string;
  colourAuto: string;
  spiceLevels: [string, string, string, string];
  allergenNames: Record<Allergen, string>;
  dietNames: Record<Diet, string>;
  months: string[];
  address: string;
  openMap: string;
  hours: string;
  closedDay: string;
  contact: string;
  call: string;
  wifiNetwork: string;
  wifiPassword: string;
  faq: string;
  legalNotes: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToMenu: string;
  offline: string;
  lastUpdate: string;
  offlineTitle: string;
  offlineBody: string;
  until: string;
};

const tr: UiText = {
  until: "bitiş",
  offline: "Çevrimdışı",
  lastUpdate: "son güncelleme",
  offlineTitle: "Şu an çevrimdışısınız",
  offlineBody:
    "Bu sayfa daha önce açılmadığı için gösterilemiyor. Daha önce açtığınız menü bağlantı olmadan da açılır.",
  address: "Adres",
  openMap: "Haritada aç",
  hours: "Çalışma saatleri",
  closedDay: "Kapalı",
  contact: "İletişim",
  call: "Ara:",
  wifiNetwork: "Ağ",
  wifiPassword: "Parola",
  faq: "Sık sorulanlar",
  legalNotes: "Yasal bilgiler",
  notFoundTitle: "Bu sayfa yok",
  notFoundBody: "Aradığınız sayfa kaldırılmış ya da adres yanlış yazılmış olabilir.",
  backToMenu: "Menüye dön",
  menu: "Menü",
  quick: "Hızlı",
  explore: "Keşfet",
  search: "Ara",
  searchPlaceholder: "Menüde ara",
  filter: "Filtre",
  picks: "Seçtiklerim",
  info: "Bilgi",
  close: "Kapat",
  categories: "Bölümler",
  languages: "Dil",
  noResults: "Aramanıza uyan ürün yok. Başka bir kelime deneyin.",
  noFilterResults: "Seçtiğiniz filtrelere uyan ürün yok.",
  clearFilters: "Filtreleri temizle",
  diets: "Beslenme",
  excludeAllergens: "İçermesin",
  maxSpice: "Acılık en çok",
  anySpice: "Fark etmez",
  showResults: (count) => `${String(count)} ürünü göster`,
  addToPicks: "Seçtiklerime ekle",
  added: "Eklendi",
  soldOut: "Tükendi",
  remainingToday: (count) => `Bugün son ${String(count)}`,
  nextRelease: (time, tomorrow) =>
    tomorrow ? `Sıradaki çıkış yarın ${time}` : `Sıradaki çıkış ${time}`,
  inSeason: "Mevsiminde",
  startsAt: (time) => `${time}'de başlar`,
  closedNow: "Şu an servis dışında",
  allergens: "Alerjenler",
  mayContain: "Eser miktarda içerebilir",
  ingredients: "Bileşenler",
  energy: "Enerji",
  portion: "Porsiyon",
  origin: "Köken",
  spice: "Acılık",
  askStaff: "Bilgi için personele sorun",
  goesWith: "Yanına",
  contains: "İçinde",
  courses: "Tabaklar",
  featured: "Öne çıkan",
  required: "Zorunlu",
  chooseUpTo: (max) => `En çok ${String(max)} seçim`,
  chooseExactly: (count) => `${String(count)} seçim`,
  optional: "İsteğe bağlı",
  unavailable: "Bugün yok",
  vatIncluded: "Fiyatlara KDV dahildir.",
  noServiceCharge: "Servis, masa ya da kuver ücreti alınmaz.",
  printedList: "Basılı fiyat listesini isteyebilirsiniz.",
  allergenStatement:
    "Ürünlerimiz alerjen içeren malzemelerle aynı mutfakta hazırlanır. Alerjiniz varsa sipariş vermeden önce personele bildirin.",
  demoNote: "Gösterim amaçlı kurgusal mekân.",
  stories: "Hikâyeler",
  goToItem: "Menüde gör",
  showWaiter: "Garsona göster",
  waiterTitle: "Sipariş",
  total: "Toplam",
  backToList: "Listeye dön",
  emptyPicks:
    'Henüz bir şey seçmediniz. Ürünün sayfasındaki "Seçtiklerime ekle" ile listenizi kurun.',
  colour: "Görünüm",
  colourLight: "Açık",
  colourDark: "Koyu",
  colourAuto: "Otomatik",
  spiceLevels: ["Acısız", "Az acılı", "Acılı", "Çok acılı"],
  allergenNames: {
    gluten: "Gluten",
    crustaceans: "Kabuklular",
    eggs: "Yumurta",
    fish: "Balık",
    peanuts: "Yer fıstığı",
    soy: "Soya",
    milk: "Süt",
    nuts: "Sert kabuklu yemişler",
    celery: "Kereviz",
    mustard: "Hardal",
    sesame: "Susam",
    sulphites: "Sülfit",
    lupin: "Acı bakla",
    molluscs: "Yumuşakçalar",
  },
  dietNames: {
    vegan: "Vegan",
    vegetarian: "Vejetaryen",
    gluten_free: "Glütensiz",
    lactose_free: "Laktozsuz",
    halal: "Helal",
  },
  months: [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ],
};

const en: UiText = {
  until: "until",
  offline: "Offline",
  lastUpdate: "last updated",
  offlineTitle: "You are offline",
  offlineBody:
    "This page has not been opened before, so it cannot be shown. The menu you opened earlier works without a connection.",
  address: "Address",
  openMap: "Open in map",
  hours: "Opening hours",
  closedDay: "Closed",
  contact: "Contact",
  call: "Call:",
  wifiNetwork: "Network",
  wifiPassword: "Password",
  faq: "Questions",
  legalNotes: "Legal information",
  notFoundTitle: "This page does not exist",
  notFoundBody: "The page may have been removed, or the address may be mistyped.",
  backToMenu: "Back to the menu",
  menu: "Menu",
  quick: "Quick",
  explore: "Explore",
  search: "Search",
  searchPlaceholder: "Search the menu",
  filter: "Filter",
  picks: "My picks",
  info: "Info",
  close: "Close",
  categories: "Sections",
  languages: "Language",
  noResults: "Nothing on the menu matches. Try another word.",
  noFilterResults: "Nothing matches the filters you chose.",
  clearFilters: "Clear filters",
  diets: "Diet",
  excludeAllergens: "Without",
  maxSpice: "Spice at most",
  anySpice: "Any",
  showResults: (count) => `Show ${String(count)} items`,
  addToPicks: "Add to my picks",
  added: "Added",
  soldOut: "Sold out",
  remainingToday: (count) => `Last ${String(count)} today`,
  nextRelease: (time, tomorrow) =>
    tomorrow ? `Next batch tomorrow ${time}` : `Next batch ${time}`,
  inSeason: "In season",
  startsAt: (time) => `Starts at ${time}`,
  closedNow: "Not served right now",
  allergens: "Allergens",
  mayContain: "May contain traces of",
  ingredients: "Ingredients",
  energy: "Energy",
  portion: "Portion",
  origin: "Origin",
  spice: "Spice",
  askStaff: "Please ask our staff",
  goesWith: "Goes well with",
  contains: "Includes",
  courses: "Courses",
  featured: "Featured",
  required: "Required",
  chooseUpTo: (max) => `Up to ${String(max)}`,
  chooseExactly: (count) => `Choose ${String(count)}`,
  optional: "Optional",
  unavailable: "Not today",
  vatIncluded: "Prices include VAT.",
  noServiceCharge: "No service, table or cover charge.",
  printedList: "A printed price list is available on request.",
  allergenStatement:
    "Our dishes are prepared in a kitchen that handles allergens. Please tell our staff about any allergy before you order.",
  demoNote: "A fictional venue for demonstration.",
  stories: "Stories",
  goToItem: "See on the menu",
  showWaiter: "Show the waiter",
  waiterTitle: "Order",
  total: "Total",
  backToList: "Back to the list",
  emptyPicks: 'Nothing picked yet. Use "Add to my picks" on a product to build your list.',
  colour: "Appearance",
  colourLight: "Light",
  colourDark: "Dark",
  colourAuto: "Automatic",
  spiceLevels: ["Not spicy", "Mild", "Spicy", "Very spicy"],
  allergenNames: {
    gluten: "Gluten",
    crustaceans: "Crustaceans",
    eggs: "Eggs",
    fish: "Fish",
    peanuts: "Peanuts",
    soy: "Soy",
    milk: "Milk",
    nuts: "Tree nuts",
    celery: "Celery",
    mustard: "Mustard",
    sesame: "Sesame",
    sulphites: "Sulphites",
    lupin: "Lupin",
    molluscs: "Molluscs",
  },
  dietNames: {
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    gluten_free: "Gluten-free",
    lactose_free: "Lactose-free",
    halal: "Halal",
  },
  months: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

const ar: UiText = {
  until: "حتى",
  offline: "غير متصل",
  lastUpdate: "آخر تحديث",
  offlineTitle: "أنت غير متصل الآن",
  offlineBody:
    "لا يمكن عرض هذه الصفحة لأنها لم تُفتح من قبل. القائمة التي فتحتها سابقًا تعمل دون اتصال.",
  address: "العنوان",
  openMap: "افتح في الخريطة",
  hours: "ساعات العمل",
  closedDay: "مغلق",
  contact: "اتصل بنا",
  call: "اتصل:",
  wifiNetwork: "الشبكة",
  wifiPassword: "كلمة المرور",
  faq: "أسئلة شائعة",
  legalNotes: "معلومات قانونية",
  notFoundTitle: "هذه الصفحة غير موجودة",
  notFoundBody: "ربما أُزيلت الصفحة أو كُتب العنوان بشكل خاطئ.",
  backToMenu: "العودة إلى القائمة",
  menu: "القائمة",
  quick: "سريع",
  explore: "اكتشف",
  search: "بحث",
  searchPlaceholder: "ابحث في القائمة",
  filter: "تصفية",
  picks: "اختياراتي",
  info: "معلومات",
  close: "إغلاق",
  categories: "الأقسام",
  languages: "اللغة",
  noResults: "لا يوجد ما يطابق بحثك. جرّب كلمة أخرى.",
  noFilterResults: "لا يوجد ما يطابق عوامل التصفية.",
  clearFilters: "مسح التصفية",
  diets: "النظام الغذائي",
  excludeAllergens: "بدون",
  maxSpice: "الحدّة القصوى",
  anySpice: "أي درجة",
  showResults: (count) => `عرض ${String(count)} صنف`,
  addToPicks: "أضف إلى اختياراتي",
  added: "أُضيف",
  soldOut: "نفد",
  remainingToday: (count) => `آخر ${String(count)} اليوم`,
  nextRelease: (time, tomorrow) =>
    tomorrow ? `الدفعة التالية غدًا ${time}` : `الدفعة التالية ${time}`,
  inSeason: "في موسمه",
  startsAt: (time) => `يبدأ الساعة ${time}`,
  closedNow: "غير متاح الآن",
  allergens: "مسببات الحساسية",
  mayContain: "قد يحتوي على آثار من",
  ingredients: "المكونات",
  energy: "الطاقة",
  portion: "الحصة",
  origin: "المصدر",
  spice: "الحدّة",
  askStaff: "يرجى سؤال الموظفين",
  goesWith: "يناسبه",
  contains: "يتضمن",
  courses: "الأطباق",
  featured: "مميز",
  required: "إلزامي",
  chooseUpTo: (max) => `حتى ${String(max)}`,
  chooseExactly: (count) => `اختر ${String(count)}`,
  optional: "اختياري",
  unavailable: "غير متوفر اليوم",
  vatIncluded: "الأسعار تشمل ضريبة القيمة المضافة.",
  noServiceCharge: "لا توجد رسوم خدمة أو طاولة.",
  printedList: "يمكنكم طلب قائمة الأسعار المطبوعة.",
  allergenStatement:
    "تُحضَّر أطباقنا في مطبخ يتعامل مع مسببات الحساسية. يرجى إبلاغ الموظفين بأي حساسية قبل الطلب.",
  demoNote: "مكان خيالي لأغراض العرض.",
  stories: "قصص",
  goToItem: "اعرضه في القائمة",
  showWaiter: "أظهِر للنادل",
  waiterTitle: "الطلب",
  total: "المجموع",
  backToList: "العودة إلى القائمة",
  emptyPicks: "لم تختر شيئًا بعد. استخدم «أضف إلى اختياراتي» في صفحة الصنف لبناء قائمتك.",
  colour: "المظهر",
  colourLight: "فاتح",
  colourDark: "داكن",
  colourAuto: "تلقائي",
  spiceLevels: ["غير حار", "حار قليلًا", "حار", "حار جدًا"],
  allergenNames: {
    gluten: "الغلوتين",
    crustaceans: "القشريات",
    eggs: "البيض",
    fish: "السمك",
    peanuts: "الفول السوداني",
    soy: "الصويا",
    milk: "الحليب",
    nuts: "المكسرات",
    celery: "الكرفس",
    mustard: "الخردل",
    sesame: "السمسم",
    sulphites: "الكبريتيت",
    lupin: "الترمس",
    molluscs: "الرخويات",
  },
  dietNames: {
    vegan: "نباتي صرف",
    vegetarian: "نباتي",
    gluten_free: "خالٍ من الغلوتين",
    lactose_free: "خالٍ من اللاكتوز",
    halal: "حلال",
  },
  months: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
};

const dictionaries: Partial<Record<Locale, UiText>> = { tr, en, ar };

/** The dictionary of a page language: English, then Turkish, for languages not written yet. */
export function uiText(locale: Locale): UiText {
  return dictionaries[locale] ?? dictionaries.en ?? tr;
}
