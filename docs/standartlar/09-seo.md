# SEO

> **Durum:** v1.2 · **Son güncelleme:** 2026-10-30
> **Kararlar:** [Bölüm 10](#10-kararlar)

## 1. Bu belge ne işe yarar

Herkese açık sayfaların teknik SEO, yapılandırılmış veri, yerel SEO ve içerik kurallarını tanımlar. Sektöre özgü şema türleri sektör kataloglarındadır ([katalog](../katalog/README.md)).

## 2. Her herkese açık sayfada [Z]

| Öğe | Kural |
|---|---|
| `title` | Benzersiz, 50–60 karakter **son ekle birlikte**: "{Sayfa konusu} · {Firma}" (ana sayfada "{Firma} · {Ne yaptığı}, {Şehir}"). Veriden ya da içerik dosyasından gelen başlıklar testte `titleTemplate.replace("%s", başlık)` uzunluğuyla denetlenir; şablona sığmayan başlık `fitTitle` ile kısaltılır |
| `description` | Benzersiz, 140–160 karakter, sayfanın vaadi + eylem |
| Canonical | Mutlak adres, sorgu parametresiz (sayfalama hariç) |
| Open Graph / Twitter | `og:title`, `og:description`, `og:image` (1200 × 630), `og:locale=tr_TR`. Kökteki `src/app/opengraph-image.tsx` ([iskelet](../iskelet/src/app/opengraph-image.tsx)) her sayfaya varsayılan görseli verir; detay sayfaları kendi görselini üretir. `tests/e2e/seo.spec.ts` her rotada `og:image` arar (nail-art-studio'da hiçbir sayfada yoktu). |
| Başlık yapısı | Tek `h1`, sayfanın ana anahtar ifadesini doğal biçimde içerir |
| JSON-LD | Sayfa türüne uygun şema (§4) |
| İç bağlantı | Her sayfa en az bir üst / kardeş sayfaya bağlanır; yetim sayfa yok |
| Görsel | Açıklayıcı `alt`, anlamlı dosya adı (`dis-beyazlatma-oncesi-sonrasi.webp`), doğru boyut |

Meta veriler Next.js Metadata API (`generateMetadata`) ile, ortak yardımcı `@/lib/seo` üzerinden üretilir; varsayılanlar `site_settings`'teki SEO bölümünden gelir, panelden sayfa bazında ezilebilir (S2+).

## 3. Teknik SEO

- **URL:** Türkçe, ASCII, kebab-case, kısa ve kalıcı: `/hizmetler/dis-beyazlatma`, `/ilanlar/kadikoy-3-1-satilik-daire-RVK-2044`. Sondaki eğik çizgi yok; büyük harf yok.
- **`sitemap.ts`:** yalnızca yayında, indekslenebilir sayfalar; `lastModified` gerçek güncelleme tarihi. 1.000+ adreste bölünmüş site haritası.
- **`robots.ts`:** canlıda panel, hesap, API, arama sonucu ve filtre kombinasyonları engellenir; demo'da tümü engellenir. Kural birim testiyle korunur (`robots.test.ts`: engellenen yollar kapalı, açılış sayfası açık).
- **Belirteçli ve imzalı sayfalar** (takip bağlantısı, randevu yönetimi, e-postadaki çıkış / onay bağlantısı, kiosk): üç katman birlikte uygulanır: sayfada `noindex`, `next.config` başlıklarında `Referrer-Policy: no-referrer` (belirteç başka siteye sızmaz), canlı `robots`'ta `Disallow`. Yalnızca alt yolları kapatmak için `/randevu/:path+` biçimi kullanılır (açılış sayfası `/randevu` açık kalır). Başlıklar `headers.spec.ts`'te denetlenir ([11](11-guvenlik.md)).
- **Durum kodları:** bulunamayan sayfa gerçek 404; kalıcı taşınan sayfa 301 (`redirects` tablosu, panelden; S3+); kaldırılan ilan ya da ürün 410 ya da ilgili kategoriye 301.
- **Filtre ve sıralama sayfaları:** kendi canonical'ı filtresiz listeyi gösterir; değerli birkaç kombinasyon (ör. "Kadıköy kiralık daire") ayrı, içerikli açılış sayfası olarak yapılır.
- **Sayfalama:** her sayfa kendi canonical'ına sahip (`?sayfa=2`); ilk sayfanın kopyasına canonical verilmez.
- **Çok dil [S]:** `/en/...` alt yolu, `hreflang` karşılıkları + `x-default`; makine çevirisi yayınlanmaz.
- **Performans** Core Web Vitals hedefleri [12-performans](12-performans.md)'tadır.
- **JavaScript'e bağımlı içerik yok:** ana içerik ve bağlantılar sunucuda render edilir.

## 4. Yapılandırılmış veri (JSON-LD)

| Sayfa | Şema |
|---|---|
| Tüm site (kök yerleşim) | `Organization` ya da sektöre uygun `LocalBusiness` alt türü (`Dentist`, `Restaurant`, `RealEstateAgent`, `LegalService`, `BeautySalon`, `ExerciseGym`, `VeterinaryCare`…): ad, logo, adres, telefon, `openingHoursSpecification`, `geo`, `sameAs`, `priceRange` |
| İç sayfalar | `BreadcrumbList` |
| Hizmet | `Service` (sağlayıcı = işletme, `areaServed`); fiyat açıksa `Offer` |
| Ürün / ilan | `Product` + `Offer` (fiyat, para birimi `TRY`, stok durumu); emlak ilanında uygun ek özellikler |
| Blog yazısı | `Article` / `BlogPosting` (yazar, yayın ve güncelleme tarihi) |
| Etkinlik | `Event` (yer, tarih, bilet `Offer`) |
| Ekip üyesi | `Person` (uzmanlık, `worksFor`) |
| SSS | `FAQPage` isteğe bağlı: Google çoğu site için SSS zengin sonucunu artık göstermiyor; işaretleme zararsızdır ama zengin sonuç beklenmez |

**Yasaklar:**
- Kurgusal ya da işletmenin kendi sitesinde topladığı yorumlar için `Review` / `AggregateRating` basılmaz (Google, işletmenin kendi hakkındaki yorum yıldızlarını göstermiyor; kurgusal veriyle de yanıltıcıdır).
- `WebSite` + `SearchAction` (site içi arama kutusu) eklenmez; Google bu özelliği kaldırdı.
- Sayfada görünmeyen bilgi şemaya yazılmaz.

Şema, sayfa verisinden üretilir (tek kaynak); yayın öncesi Rich Results Test ve Schema.org doğrulayıcıdan geçer.

**Testle denetim (S2+):** `structured-data.spec.ts` her herkese açık rotada JSON-LD bloklarını ayrıştırır (bozuk JSON hata), iç içe bütün `@type` değerlerini toplar, `Review` / `AggregateRating` bulunursa düşer ve planın SEO tablosundaki tipleri kendi sayfalarında arar. Aynı dosya site haritasındaki her adresi çağırır: yinelenen, belirteçli, teşekkür ya da sorgulu adres listelenmez, her adres 200 döner. Levha'da bu test iki eksik şemayı (liste sayfasında `CollectionPage`, işte `ImageObject`) hemen gösterdi.

## 5. Yerel SEO

- **NAP tutarlılığı:** ad, adres, telefon sitede, şemada, Google İşletme Profili'nde ve dizinlerde birebir aynı; tek kaynak `site_settings`.
- İletişim sayfasında harita, açık adres, ulaşım tarifi, çalışma saatleri (resmî tatil notu dahil).
- Hizmet bölgesi sayfaları **[Ö]**: yalnızca o bölgeye özgü gerçek içerik varsa (ekip, referans iş, ulaşım). Şehir adı değiştirilmiş kopya sayfalar (doorway) yapılmaz.
- Google İşletme Profili kurulum notları teslim belgesinde; yorum isteme bağlantısı [Ö] panelde.

## 6. İçerik

- Her hizmet / ürün sayfasında özgün, en az birkaç paragraflık bilgi: ne, kime uygun, süreç, süre, fiyat aralığı, sık sorular. Başka sayfadan kopya metin yok.
- Başlıklar soruya cevap verir biçimde ("Diş beyazlatma kaç seans sürer?").
- Blog [Ö] S2+: plan §15'teki konu listesiyle; ince içerikli yazı yayımlanmaz.
- Yapay zekâ ile üretilen metin uzman gözünden geçmeden yayımlanmaz (özellikle sağlık, hukuk, finans: "YMYL").
- Yazar ve güncelleme tarihi görünür (sağlık ve hukukta uzman adı + unvanı).

## 7. Demo ve canlı

| | Demo | Canlı |
|---|---|---|
| `robots` | `Disallow: /` | Normal |
| Sayfa meta | `noindex, nofollow` | Kaldırılır |
| Canonical | Demo adresi | Gerçek alan adı |
| Lighthouse SEO | Yalnızca `noindex` nedeniyle eksik puan kabul edilir; diğer denetimler geçmeli | 100 |

Geçiş adımları [16 §8](16-ortamlar-ve-yayin.md#8-demodan-canlıya-geçiş)'dedir.

## 8. Yayından sonra (canlı)

- Search Console ve Bing Webmaster doğrulaması, site haritası gönderimi.
- Eski siteden taşınıyorsa: eski adreslerin tam listesi → 301 eşlemesi → yayından sonra 404 raporu izlenir.
- İlk ay haftalık: kapsam hataları, Core Web Vitals raporu, sorgu / sayfa performansı.

## 9. Ölçüm

Dönüşüm olayları (form gönderimi, arama düğmesi, WhatsApp, yol tarifi, randevu tamamlandı) çerezsiz analitikte özel olay olarak tanımlanır; panelde [Ö] "Kaynak raporu" (UTM + yönlendiren) talep kayıtlarından üretilir.

## 10. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| SEO-01 | SSS şeması | İsteğe bağlı, zengin sonuç beklentisi yok | Google SSS zengin sonuçlarını 2026'da büyük ölçüde kaldırdı. Brifteki "FAQ schema" maddesi güncellendi. |
| SEO-02 | Site içi arama şeması | Kullanılmaz | Google sitelinks arama kutusunu Kasım 2024'te kaldırdı. |
| SEO-03 | Yorum yıldızları | Kendi sitesindeki yorum için `AggregateRating` yok | Google işletmenin kendi hakkındaki yorumlarına yıldız göstermiyor; demo'da kurgusal veriyle de yanıltıcı. |
| SEO-04 | Demo SEO puanı | `noindex` kaynaklı düşüş kabul | Brifteki "Lighthouse SEO 100" hedefi demo'nun indekslenmeme kuralıyla çelişiyordu. |
| SEO-05 | URL dili | Türkçe ASCII | Kullanıcı ve arama motoru için okunur; kodlama sorunları yok. |
| SEO-06 | Varsayılan OG görseli | İskelette kök `opengraph-image.tsx` + e2e denetimi | nail-art-studio'da Faz 5 denetimine kadar hiçbir sayfada paylaşım görseli yoktu. |
| SEO-07 | Başlık uzunluğu | Son ekle birlikte ≤ 60, veri başlıkları testte | nail-art-studio'da veriden kurulan başlıklar 60'ı aştı (D-020); Levha'da içerik dosyasındaki 53 karakterlik başlık " · Levha" ekiyle 61 oldu (D-048). |
| SEO-08 | Belirteçli sayfalar | `noindex` + `no-referrer` başlığı + canlı `Disallow` | Levha'da randevu yönetimi ve bakım çıkışı sayfalarında yalnızca meta etiket vardı (D-050). |
| SEO-09 | Şema ve site haritası denetimi | `structured-data.spec.ts` | Gözle denetim iki eksik şemayı kaçırmıştı (Levha D-27). |

## 11. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | Varsayılan OG görseli ve `seo.spec.ts` (SEO-06). |
| 2026-10-30 | v1.2 | Başlık son ekle birlikte (SEO-07); belirteçli sayfa kalıbı (SEO-08); şema ve site haritası testi (SEO-09). |
