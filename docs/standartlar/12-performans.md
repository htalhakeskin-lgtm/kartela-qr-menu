# Performans

> **Durum:** v1.2 · **Son güncelleme:** 2026-10-30
> **Kararlar:** [Bölüm 9](#9-kararlar)

## 1. Bu belge ne işe yarar

Performans hedeflerini, bütçelerini ve bunları tutturan uygulama kurallarını tanımlar. Ölçüm her zaman **mobil profil** ile yapılır.

## 2. Hedefler

| Ölçüt | Hedef | Nerede ölçülür |
|---|---|---|
| LCP | ≤ 2,5 sn | Lighthouse mobil (önizleme), canlıda alan verisi |
| INP | ≤ 200 ms | Canlıda alan verisi; geliştirmede etkileşim testleri |
| CLS | ≤ 0,1 | Lighthouse + e2e |
| TTFB (önbellekli sayfa) | ≤ 0,8 sn | Lighthouse |
| Lighthouse mobil | Performans ≥ 90, Erişilebilirlik ≥ 95, En iyi uygulamalar ≥ 95, SEO 100 (canlı) | Önizleme adresinde, ana şablon sayfalarında |

Alan verisi hedefleri 75. yüzdeliktir. Lighthouse, ana sayfa + her sayfa şablonundan birer örnek (liste, detay, form, iletişim) üzerinde çalıştırılır.

**Demo'da SEO puanı:** `noindex` olan demo sitesinde Lighthouse SEO kategorisi düşük çıkar (nail-art-studio: 69); bu bir kusur değildir. Demo'da kategori puanı yerine SEO denetimleri tek tek doğrulanır (`document-title`, `meta-description`, `http-status-code`, `link-text`, `crawlable-anchors`, `image-alt`, `hreflang`, `canonical`); `is-crawlable` ve `robots-txt` demo'da kapalıdır ([iskelet/lighthouserc.js](../iskelet/lighthouserc.js)).

## 3. Bütçeler

| Kaynak | Herkese açık sayfa | Panel |
|---|---|---|
| İlk yük JavaScript (gzip, rota başına) | Çerçeve tabanı + **uygulama payı ≤ 50 KB** (Next.js 16 + React 19 ile ≈ 215 KB) | Çerçeve tabanı + uygulama payı ≤ 130 KB (≈ 295 KB) |
| LCP görseli | ≤ 200 KB (AVIF / WebP) | — |
| Yazı tipi dosyaları | ≤ 2 aile, ≤ 4 dosya, alt kümeli | Aynı |
| Üçüncü taraf betik | Onaysız 0; onaylı en fazla 2 | 0 |
| Veritabanı sorgusu / sayfa | ≤ 5 (N+1 yok) | ≤ 10 |

**Çerçeve tabanı:** Next.js + React'ın kendi çalışma zamanı (react-dom, yönlendirici, Turbopack çalışma zamanı) uygulama kodundan bağımsızdır; Levha'da (Next.js 16.4, React 19) ≈ 165 KB ölçüldü, 170 KB'lık eski mutlak bütçe uygulamaya ~5 KB bırakıyordu. Taban Faz 3'te iskeletin boş sayfasında ölçülür ve plana yazılır; bütçe = taban + uygulama payı. Çerçeve sürümü yükselince taban yeniden ölçülür.

**Ölçüm yöntemi:** ilk yük, sayfanın HTML'indeki `<script src>` parçalarının gzip toplamıdır: `node scripts/olcum/ilk-yuk-js.mjs <adres> <yol…>` (iskelet). Lighthouse'un ağ listesi **kullanılmaz**: görünür bağlantıların önceden indirilen (prefetch) parçalarını da sayar. Her sayfada aynı fazlalık görülürse kaynak kök düzende ya da `instrumentation-client`'tadır.

**İçe aktarma biçimi:** büyük kütüphaneden tek işlev gerekiyorsa adlandırılmış alt yol içe aktarılır (`import { config } from "zod/v4/core"`); ad alanı içe aktarması (`import { z } from "zod"`) ağaç sallamayı engeller. Levha'da istemci enstrümantasyonundaki tek `z.config` çağrısı bütün Zod'u her sayfaya koydu (31 KB gzip).

**Form sayfaları:** nail-art-studio'da iletişim ve randevu sayfaları istemci tarafı doğrulama yüzünden 193–204 KB'a çıktı; Levha'da form sayfaları tabanın 35–48 KB üstündeydi. Form sayfalarında da aynı uygulama payı geçerlidir; §4'teki form kuralı bunu sağlar.

Bütçe aşımı PR'da gerekçeyle kabul edilir ya da düzeltilir. Next.js 16'nın `next build` çıktısı artık rota boyutu göstermez; rota ölçümü yukarıdaki betikle, paket içeriği `pnpm analyze` (`next analyze`, Turbopack paket analizi) ile yapılır ve yeni bağımlılık eklenen PR'a özeti yazılır (S2+).

## 4. Render ve veri

- Vitrin sayfaları statik / önbellekli üretilir; içerik değişince etiketle yenilenir ([02 §6](02-mimari.md#6-render-ve-önbellek)).
- Bağımsız veri istekleri paralel başlatılır; yavaş bölümler `Suspense` ile akışla gelir, sayfanın geri kalanını bekletmez.
- İstemci bileşenleri yaprakta; büyük kütüphaneler (harita, grafik, zengin metin düzenleyici, galeri) `next/dynamic` ile yalnızca gerektiği yerde yüklenir.
- Listeler sayfalanır (varsayılan 24 kayıt); "tümünü getir" yok.
- Sık filtrelenen kolonlar indeksli ([04 §7](04-veri.md#7-kısıtlar-ve-indeksler)); yavaş sorgu (> 200 ms) logda uyarı üretir.
- Fonksiyon bölgesi veritabanıyla aynı (`fra1` + Neon Frankfurt).
- **Soğuk veritabanı sayfayı bekletmez.** Neon'un ücretsiz planı boşta kalınca uykuya geçer; nail-art-studio'da uzun bir boşluktan sonraki ilk ziyarette canlı bölümler 52 saniye gecikti. Herkese açık sayfalarda veritabanına istek anında giden her bölüm (en yakın boş saatler, canlı kontenjan) `Suspense` içindedir ve yedek görünümü kendi başına anlamlıdır ("Uygun saatleri görmek için randevu sayfasına geçin"). Sorgu zaman aşımı herkese açık sayfalarda 3 sn'dir; aşılırsa yedek görünüm kalır. Sayfanın kabuğu ve içeriği önbellekten gelir.
- **Formlarda istemci doğrulaması:** sunucu her zaman aynı Zod şemasıyla doğrular ve alan hatalarını `Result` içinde döner (`useActionState` ile gösterilir). İlk yükte istemcide yalnızca HTML kısıtları (`required`, `type`, `minLength`, `pattern`) çalışır. Anında doğrulama gereken çok adımlı formlarda şema ilk etkileşimde `import()` ile ayrı bir parça olarak yüklenir ve ilk yük JS'ine girmez. İstemcide `z.config(z.locales…)` çağrılmaz; esbuild ile yapılan ölçümde Zod 4'ün yerel dil paketleri ağaç sarsıntısıyla ayıklanmayıp pakete girdi (yaklaşık 260 KB küçültülmüş). Türkçe mesajlar `config/rules.ts`'ten gelir.
- **Deneysel Next.js ayarları** (ör. `partialPrefetching`) iskelette kapalı gelir; plan §10'da gerekçeyle açılır ve ölçülür.

## 5. Görseller

- Her görsel `next/image` ile, doğru `sizes` değeriyle; ilk ekran görseli `priority` (ya da `fetchPriority="high"`), diğerleri tembel. Elle `srcset` yazılmaz; türev üretiliyorsa `w` tanımlayıcısı dosyanın gerçek genişliğidir. Keskinlik `gorsel-kalitesi.spec.ts` ile ölçülür ([20 §6](20-gorsel-kalite.md#6-görsel-teslimi)).
- Next.js 16'da `images.qualities` izin listesi tanımlanır (ör. `[60, 75, 90]`); kullanılmayan kalite değeri reddedilir.
- Vercel Hobby'de görsel dönüştürme kotası sınırlıdır (ayda 5.000): stok görseller kaynağın CDN'inden özel loader ile, yüklenen görseller yüklemede boyutlandırılmış olarak sunulur; yalnızca gerekli görseller Vercel optimizasyonundan geçer.
- Yer tutucu: `placeholder="blur"` (statik içe aktarılan görselde) ya da token renginde arka plan.
- Video arka plan yok; tanıtım videosu tıklayınca yüklenir (önizleme görseliyle).
- SVG ikonlar satır içi değil bileşen olarak; büyük süs SVG'leri dosya.

## 6. Yazı tipi, CSS ve betik

- `next/font` ile kendi sunucumuzdan, `display: swap`, `latin-ext`; değişken yazı tipi tercih edilir.
- Tailwind dışında global CSS en az; kullanılmayan bileşen kütüphanesi stili yok.
- Üçüncü taraf betikler `next/script` ile `lazyOnload` ya da onaydan sonra; etiket yöneticisi (GTM) varsayılan değildir.
- Harita, sohbet balonu, yorum gömmesi gibi ağır parçalar etkileşimle ya da görünür olunca yüklenir (önizleme görseli + düğme).

## 7. Hareket ve etkileşim

- Animasyonlar yalnızca `transform` / `opacity` ([06 §9](06-arayuz.md#9-hareket)).
- Uzun görevler (> 50 ms) olay işleyicilerinde bölünür; yazarken filtrelemede `useDeferredValue` ya da gecikmeli istek.
- Kaydırma olayına doğrudan bağlı hesaplama yok; `IntersectionObserver` ya da Motion'ın kaydırma API'si.

## 8. Ölçüm araçları

| Araç | Ne zaman |
|---|---|
| Lighthouse CI (`pnpm lighthouse`, [iskelet/lighthouserc.js](../iskelet/lighthouserc.js)) | CI'da her PR'da ana şablonlarda: erişilebilirlik ve en iyi uygulamalar eşiğin altındaysa hata, performans 0,9'un altındaysa uyarı. Yerelde dilim sonunda değişen şablonda |
| Lighthouse (mobil, önizleme adresi) | Yayından önce tüm şablonlarda; gerçek ağ ve CDN koşulunu görür |
| `pnpm analyze` (`next analyze`) | Yeni bağımlılık eklendiğinde, yayından önce |
| Vercel Speed Insights ya da web-vitals → analitik olayı [Ö] | Canlıda alan verisi |
| Playwright CLS denetimi | e2e'de ana sayfalarda |

## 9. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| PF-01 | Ölçüm profili | Mobil | Ziyaretçi çoğunluğu mobil; masaüstü puanı yanıltıcı yüksek çıkar. |
| PF-02 | JS bütçesi | Ölçülen çerçeve tabanı + uygulama payı: herkese açık ≤ 50 KB, panel ≤ 130 KB; HTML'deki parçaların gzip toplamıyla ölçülür | Revnak §11.4 bütçesi (170 / 300 KB) Next.js 16 + React 19'la tutmuyordu: Levha'da taban ≈ 165 KB (D-045). Revnak K14'te GSAP bu bütçe yüzünden demoda kullanılmadı; uygulama payı bu dengeyi korur. Panel daha az SEO / ilk izlenim baskısı taşır. |
| PF-03 | Görsel kotası | Stok görsel kendi CDN'inden | Hobby planı dönüşüm kotası. |
| PF-04 | Bölge | `fra1` + Neon Frankfurt | Türkiye'ye yakın, veritabanıyla aynı bölge. |
| PF-05 | Lighthouse CI | İskelette hazır; performans uyarı, diğerleri hata | nail-art-studio'da Lighthouse elle ölçüldü ve performans 86–89'da kaldı; ölçüm her PR'da otomatik olursa gerileme dilim içinde görünür. |
| PF-06 | Form JS'i | HTML kısıtları + sunucu doğrulaması; şema gerekirse ilk etkileşimde ayrı parça | Form sayfaları bütçeyi 23–34 KB aştı; "aynı şema" ilkesi korunur, maliyeti ilk yükten çıkar. |
| PF-07 | Soğuk veritabanı | Herkese açık sayfada istek anı sorgusu `Suspense` + anlamlı yedek + 3 sn zaman aşımı | Neon uykudan uyanırken ilk ziyaret 52 sn sürdü. |
| PF-08 | Deneysel ayarlar | İskelette kapalı | nail-art-studio derslerinin en etkili önerilerinden biri deneysel ön yükleme ayarının (`partialPrefetching`) iskelette kapalı gelmesiydi; deneysel davranış ancak bilinçli açılıp ölçülünce sorun izlenebilir. |

## 10. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | Demo'da SEO ölçümü, form JS kuralı, soğuk veritabanı kuralı, deneysel ayarlar, Lighthouse CI (PF-05…PF-08). |
| 2026-10-30 | v1.2 | JS bütçesi çerçeve tabanı + uygulama payı (PF-02, D-045); ilk yük ölçüm yöntemi ve betiği; adlandırılmış alt yol içe aktarması (D-044). |
