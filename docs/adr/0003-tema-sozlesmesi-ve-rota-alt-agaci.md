# ADR-0003: Tema sözleşmesi ve tema başına rota alt ağacı

> **Durum:** Önerildi · **Tarih:** 2026-11-04

## Bağlam

Her mekân kendi temasıyla bağımsız bir site gibi görünmeli. İki tür tema var: **hazır tema** (token'lar + birkaç yerleşim seçeneği, hızlı mekân) ve **özel tema** (mekâna özgü bileşenler ve imza etkileşimi). Koşullar:

1. Temalar görünümü olmayan ortak menü çekirdeğinin üzerine kurulur: veri, filtre, arama, fiyat biçimi, Seçtiklerim, görünüm hatırlama, etkin menü hesabı.
2. Bir mekânın teması başka mekânın JavaScript paketine girmez; paket bütçesi mekân başına ölçülür.
3. Tema; token, yazı tipi, yerleşim, ortak bileşenlerin yerine geçen bileşenler, hareket ayarları ve imza etkileşimlerini içerir.
4. Arapça gibi sağdan sola dillerde `<html dir="rtl">`; temanın yazı tipleri ve CSS'i yalnızca kendi sayfalarında yüklenir.

Tek bir `[mekan]` dinamik rotasında temayı çalışma anında seçmek (`themes[venue.theme]`) bu koşulları güvenceye almaz: aynı rota dosyası bütün temaları içe aktarınca istemci bileşenlerinin, CSS'in ve `next/font` ön yüklemelerinin hangilerinin pakete gireceği paketleyicinin ayrıntısına kalır.

## Karar

### 1. Tema = rota alt ağacı + kendi kök düzeni

Her tema `src/app/tema-{tema}/[mekan]/[dil]/` altında kendi rota ağacına sahiptir ve bu ağacın `layout.tsx`'i **kök düzendir** (uygulamada tek bir `app/layout.tsx` yoktur; platform ve panel `(platform)` grubunun kendi kök düzenini kullanır). Böylece:

- `<html lang dir>`, yazı tipleri, global CSS (Tailwind girişi + tema token'ları) yalnızca o temanın sayfalarında bulunur.
- Paketleyici her tema ağacını ayrı giriş olarak derler; Rakım'ın özelleştiricisi Sade kullanan bir mekânın paketine giremez. Bu, paket testiyle ölçülür (BR-TMA-001).
- Hazır temayı kullanan bütün mekânlar aynı ağacı paylaşır (`/tema-sade/kepce/…`, `/tema-sade/{baska}/…`); kodları zaten ortaktır.

Rota dosyaları elle yazılmaz; `pnpm mekan:yeni` ve `pnpm tema:yeni` üretir. Her dosya birkaç satırlık bağlayıcıdır:

```ts
// src/app/tema-rakim/[mekan]/[dil]/page.tsx — ÜRETİLDİ, elle düzenlenmez
import theme from "@/themes/rakim";
import { createQuickMenuPage, venueParamsFor } from "@/platform/routes/quick-menu";

export const generateStaticParams = venueParamsFor(theme.id);
export const generateMetadata = createQuickMenuPage.metadata(theme);
export default createQuickMenuPage(theme);
```

Üretilen rotalar: `layout.tsx` (kök), `page.tsx` (hızlı menü), `kesfet/page.tsx`, `urun/[urun]/page.tsx` (paylaşılabilir ürün adresi; ziyaretçi içinde alttan panel açılır), `bilgi/page.tsx`, `stil/page.tsx`, `yazdir/{kapi,masa,qr}/page.tsx`, `cevrimdisi/page.tsx`, `not-found.tsx`, `error.tsx`, `opengraph-image.tsx`, `manifest.webmanifest/route.ts`, `robots.txt/route.ts`, `site-haritasi/route.ts` (dışarıda `/sitemap.xml`; ADR-0002), `sw.js/route.ts`, `icon.tsx`.

ESLint modül sınırı: `src/themes/{a}/**` başka bir temanın klasöründen içe aktaramaz; temalar yalnızca `@/platform/theme`, `@/platform/menu` ve `@/components/ui` yüzeylerini kullanır.

### 2. Tema sözleşmesi (TypeScript arayüzü)

Taslak; D-06'da `src/platform/theme/contract.ts` olarak kesinleşir. Her tema `export default { … } satisfies ThemeModule`.

```ts
// src/platform/theme/contract.ts — TASLAK
import type { ComponentType } from "react";
import type { ItemView, MenuView, SectionView, StoryView, VenueView, Locale } from "@/platform/menu";

export type Daypart = "sabah" | "ogle" | "aksam" | "gece";
export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Ortak katmanın okuduğu CSS değişkenleri. Her tema hepsini verir; eksik token derlemede hata. */
export interface ThemeTokens {
  color: {
    background: string; surface: string; surfaceMuted: string;
    foreground: string; mutedForeground: string; border: string;
    primary: string; primaryForeground: string;
    accent: string;            // ekranın ≤ %10'u (GK-05)
    soldOut: string; focus: string;
  };
  radius: { sm: string; card: string; sheet: string; pill: string };
  space: { gutter: string; section: string };
  shadow: { sheet: string };
  font: { display: string; body: string; data?: string }; // CSS değişken adları (next/font `variable`)
  typeScale: readonly number[];                            // px, en az 7 kademe
}

/** Yazı tipleri tema klasöründe next/font ile bir kez bildirilir; burada yalnızca sınıflar taşınır. */
export interface ThemeFonts { className: string; rtlClassName?: string }

export interface MotionPreset {
  enter: "none" | "fade" | "rise";
  sheet: "spring" | "ease";
  priceTick: boolean;          // fiyat değişince rakam kayar (yalnızca transform / opacity)
  // prefers-reduced-motion altında ortak katman hepsini "none"a çeker; tema bunu geçersiz kılamaz.
}

export type QuickLayout = "liste" | "kart" | "izgara" | (string & {});
export type ExploreLayout = "akis" | "dergi" | "duraklar" | (string & {});

/** Görünüm yuvaları. Temel (base) uygulamalar Sade'den gelir; tema yalnızca değiştirdiğini verir. */
export interface ThemeSlots {
  Shell: ComponentType<ShellProps>;                 // üst çubuk, görünüm geçişi, dil, alt bilgi + SiteCredit
  CategoryBar: ComponentType<CategoryBarProps>;     // yapışkan; etkin bölümü izler
  SearchField: ComponentType<SearchFieldProps>;
  FilterPanel: ComponentType<FilterPanelProps>;     // diyet, alerjen dışlama, acılık, fiyat
  SectionHeader: ComponentType<SectionHeaderProps>;
  ItemCard: ComponentType<ItemCardProps>;           // variant: "satir" | "kart" | "one-cikan"
  ItemSheet: ComponentType<ItemSheetProps>;         // alttan açılan ürün detayı
  Price: ComponentType<PriceProps>;                 // biçimi çekirdekten alır, kendisi biçimlemez
  ItemFacts: ComponentType<ItemFactsProps>;         // alerjen, diyet, acılık, bileşen, enerji, gramaj, köken
  OptionPicker: ComponentType<OptionPickerProps>;   // useConfigurator() durumunu çizer
  Picks: ComponentType<PicksProps>;                 // Seçtiklerim + "garsona göster"
  Story: ComponentType<StoryProps>;                 // Keşfet bloğu: zengin metin, galeri, durak
  MenuNotice: ComponentType<MenuNoticeProps>;       // saat dışı menü, mevsim, günün menüsü yok
  LegalNote: ComponentType<LegalNoteProps>;         // KDV dahil, alerjen beyanı, basılı liste, ek ücret
  EmptyState: ComponentType<EmptyStateProps>;
  ImageFallback: ComponentType<ImageFallbackProps>; // fotoğrafsız ürün
}

export interface ThemeModule {
  id: string;                                       // src/themes/{id}
  kind: "hazir" | "ozel";
  version: string;
  supports: {
    rtl: boolean;
    layouts: { quick: readonly QuickLayout[]; explore: readonly ExploreLayout[] };
  };
  fonts: ThemeFonts;
  tokens: ThemeTokens;
  tokenVariants?: {
    dark?: DeepPartial<ThemeTokens>;                         // prefers-color-scheme ve "akşam" kipi
    daypart?: Partial<Record<Daypart, DeepPartial<ThemeTokens>>>; // saate göre değişen değerler
    context?: Record<string, DeepPartial<ThemeTokens>>;      // bağlam bölgesine göre (plaj, teras)
  };
  motion: MotionPreset;
  slots: Partial<ThemeSlots>;
  signature?: Record<string, ComponentType<SignatureProps>>; // ör. { configurator, beanCard, daypartSwitch }
  print: {
    QrCard: ComponentType<QrCardProps>;
    DoorList?: ComponentType<PrintListProps>;   // yoksa temel uygulama tema token'larıyla
    TableMenu?: ComponentType<PrintListProps>;
  };
  configSchema?: import("zod").ZodType;              // mekânın bu tema için ayarları (yerleşim, renk, yazı çifti)
  meta(venue: VenueView): { themeColor: string; ogBackground: string; iconGlyph: string };
}
```

**Görünümsüz çekirdek** (`@/platform/menu`, temalar bunun üstüne kurulur):

| API | Ne yapar |
|---|---|
| `getVenueMenu(venueId, locale)` | `"use cache"` + `cacheTag("menu:{mekan}")`; çevirisi düşmüş, görünür menü ağacı (`MenuView`) |
| `useActiveMenus({ now, context })` | Saat / gün / mevsim pencereleri ve bağlama göre etkin menüler (istemcide, `Europe/Istanbul`) |
| `useMenuSearch(items, locale)` | `tr-TR` duyarlı anlık arama (İ / ı, aksan); sonuçsuz aramayı istatistiğe bildirir |
| `useMenuFilters()` | Diyet, alerjen dışlama, acılık, fiyat aralığı; adres çubuğuyla eşli (`?filtre=`) |
| `useConfigurator(item)` | Seçenek grupları, en az / en çok, uyumluluk kuralları, canlı fiyat (`domain/configurator.ts`) |
| `usePicks()` | Seçtiklerim (mekân başına `localStorage` anahtarı), "garsona göster" görünümü |
| `useView()` | Hızlı menü / Keşfet; seçim çereze yazılır, proxy bir sonraki açılışta uygular |
| `useVenueContext()` | QR bağlamı (`?b=M12` → masa 12, bölge "teras") |
| `formatPrice(price, unit, locale)` | `lib/format` üstünde; birimli fiyat ("100 g · 240 ₺"), kadeh / şişe |
| `t(field, locale)` | Alan bazında çeviri; eksikse varsayılan dile düşer ve `lang` işaretler |

### 3. Hazır tema ve mekân yapılandırması

Hazır tema ("Sade") bütün yuvaların temel uygulamasıdır ve diğer temaların düştüğü varsayılandır. Mekân, hazır temayı `venues.theme_config` ile yapılandırır (temanın `configSchema`'sıyla doğrulanır): renk token'ları, hızlı menü yerleşimi (liste / kart / ızgara), Keşfet yerleşimi, yazı çifti (temanın sunduğu katalogdan; yalnızca seçilen çiftin dosyası yüklenir), koyu mod.

### 4. Uygunluk (konformans) denetimi

`tests/tema/` altında her tema, uç durum fikstür mekânıyla ("test-mekan": fotoğrafsız ürün, 80 karakterlik ad, tükendi, yarım porsiyon, 100 g fiyatı, kadeh / şişe, zorunlu seçenek, RTL, çevirisi eksik alan, boş bölüm) render edilir: Vitest'te yuva sözleşmesi, Playwright'ta taşma + axe + ekran görüntüsü. Yeni tema bu takımdan geçmeden mekâna bağlanamaz (BR-TMA-002).

## Sonuçlar

- **Olumlu:** Paket ve CSS yalıtımı yapı gereği; tema sınırları ESLint ile denetlenir; mekâna özgü kök düzen tam tasarım özgürlüğü verir; yeni tema eklemek ortak çekirdeğe dokunmaz.
- **Olumsuz / ödünler:** Tema başına üretilen ince rota dosyaları (~15 dosya); elle düzenlenirse sapma olur → dosyalar üretim imzası taşır, CI'da yeniden üretip fark arar. Kök düzenler arası gezinme tam sayfa yüklemesidir (mekânlar arası bağlantı zaten yok).
- **Yeniden değerlendirme koşulu:** Next.js çalışma anında seçilen modüllerin istemci paketini kesin olarak ayırmayı belgelenmiş biçimde garanti ederse, tek dinamik rota + tema haritasına dönülebilir.

## Değerlendirilen alternatifler

| Seçenek | Neden seçilmedi |
|---|---|
| Tek `[mekan]` rotası + çalışma anında tema haritası (`themes[id]`) | Paket, CSS ve yazı tipi ön yüklemesinin yalıtımı paketleyiciye kalır; mekân başına bütçe garanti edilemez |
| Tek rota + `next/dynamic` ile tembel tema içe aktarımı | İstemci JS'i ayrılır ama sunucu tarafı CSS ve `next/font` bildirimleri rotaya karışır; RSC'de koşullu kök düzen (`<html>`) kurulamaz |
| Tema = yalnızca token (CSS değişkeni) | Hazır tema için yeterli, özel tema (bileşen + etkileşim) için yetersiz; brif ikisini de istiyor |
