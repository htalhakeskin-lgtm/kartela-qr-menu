<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Kartela — çok mekânlı QR menü platformu

> **Sistem:** web-proje 1.2.0 · **Seviye:** S4 · **Hesap modeli:** A (hesapsız ziyaretçi, çok rollü panel) · **Varyant:** V1 + ADR-0001…0005 · **Ortam:** Demo

## Proje

Kafe, restoran ve bar gibi mekânlar için QR ile açılan dijital menü. Tek Next.js uygulaması; her mekân kendi alan adında, kendi temasıyla bağımsız bir site gibi görünür (alan adına göre kiracı). Asıl çıktı altyapıdır: menü motoru, tema sözleşmesi, kiracı yalıtımı ve `pnpm mekan:yeni`. İlk mekân üçüncü dalga kahveci **Rakım** (özel tema "Demleme Defteri"); deneme mekânı **Kepçe** esnaf lokantası (hazır tema Sade, TR + EN + AR).

- Plan (tek doğru kaynak): [docs/proje-plani.md](docs/proje-plani.md)
- İlerleme ve sıradaki dilim: [docs/ilerleme.md](docs/ilerleme.md)
- Mimari kararlar: [docs/adr/](docs/adr/)
- Kalite kapıları: [docs/kalite-kapilari.md](docs/kalite-kapilari.md)
- Standartlar (salt okunur kopya): [docs/standartlar/](docs/standartlar/README.md)

## Komutlar

| Komut | Ne yapar |
|---|---|
| `docker compose up -d` | Yerel PostgreSQL 18 (`localhost:5436`, K-30) |
| `pnpm dev` | Geliştirme sunucusu `localhost:3020` (mekânlar D-01'den sonra `rakim.localhost:3020`) |
| `pnpm db:generate` / `pnpm db:migrate` | Migration üret / uygula |
| `pnpm auth:generate` | Better Auth tablolarını yeniden üret (eklenti / alan değişince; ardından `db:generate`) |
| `pnpm db:seed` / `pnpm db:reset` | Demo verisini yükle / sıfırla ve yeniden yükle (`PLATFORM_DEMO=true` iken) |
| `pnpm lint` · `pnpm typecheck` · `pnpm format:check` | Statik denetim (`next typegen` önce çalışır) |
| `pnpm test` | Birim + entegrasyon (Vitest) |
| `pnpm test:e2e` | Uçtan uca (Playwright: mobil + masaüstü, a11y, taşma, görsel keskinliği, SEO, başlıklar) |
| `pnpm lighthouse` | Lighthouse CI (build sonrası; menü sayfalarında performans ≥ 0,95 hata, K-17) |
| `pnpm olcum:js <adres> <yol…>` | Rota başına ilk yük JS (Git Bash'te `MSYS_NO_PATHCONV=1`) |
| `pnpm gorsel:kontrol <klasör>` | Görsel boyut raporu + temas sayfası; seçim yaparken görüntüye bak |
| `pnpm check` | CI'daki denetimlerin e2e dışındaki tamamı |
| `pnpm screenshots` · `pnpm mockup` | Portfolyo / inceleme ekran görüntüleri · cihaz mockup'ları |

## Klasörler

```
src/app/(platform)/                 platform kök düzeni: tanıtım, yasal, /stil (panel D-18'de kendi kök düzeninde)
src/app/tema-{tema}/[mekan]/[dil]/  tema rota ağacı = kök düzen (ADR-0003); D-21'den sonra ÜRETİLİR
src/app/global-not-found.tsx        eşleşmeyen adres; kendi kendine yeter, CSS / next/font içe AKTARMAZ (K-35)
src/app/og/platform/                platformun paylaşım görseli (sabit adres)
src/themes/{tema}/                  tema modülü: token CSS'i, yazı tipleri, yuvalar, imza bileşenleri
src/platform/                       görünümsüz çekirdek: menu/ theme/ routes/ i18n/ tenant/ (D-01…D-08)
src/server/                         db/ · auth.config.ts + auth.ts · action.ts · channels/ · content/
src/lib/ · src/config/              env, format, money, text, seo, image-loader · limits (P-), rules (BR), permissions
content/                            yasal/ · mekanlar/{ad}/ (D-04)
tests/e2e/ · tests/integration/     Playwright · Vitest + PostgreSQL (kiracı test takımı D-02)
```

## Projeye özgü notlar

- **Kiracı:** her mekân sorgusu `withVenue()` kapsamında; kiracı tablolarında RLS ve `(venue_id, id)` bileşik FK (ADR-0004). Önbellek etiketleri mekân önekli: `menu:{mekan}`.
- **Kip:** `DEMO_MODE` yok. Platform işlemleri `PLATFORM_DEMO` ile; ziyaretçi davranışı (noindex, demo notu) mekânın `venues.mode` alanıyla (K-06).
- **Temalar birbirine dokunmaz:** bir tema başka temanın klasöründen içe aktaramaz. Her rotanın girişine giren dosyalar (`global-not-found`, `global-error`) hiçbir paylaşılan CSS ya da `next/font` içe aktarmaz; aktarırsa o yazı tipi bütün mekânlarda ön yüklenir (Faz 3 ölçümü, K-35). Rota grubundaki meta görsel dosyaları karmalı adres alır; sabit adres gerekiyorsa rota işleyicisi ya da `public/` kullanılır.
- **Menü sayfaları statik:** saat, bağlam (`?b=`), Seçtiklerim istemcide (ADR-0005). Statik CSP `'unsafe-inline'` taşır; betik özeti EKLENMEZ (K-33).
- **Görseller:** stok görsel Unsplash / Pexels CDN'inden özel yükleyiciyle (`src/lib/image-loader.ts`); Vercel görsel optimizasyonu kullanılmaz (K-16).
- **Mevzuat:** yeme-içmede servis / masa / kuver ücreti tanımlanamaz (BR-YSL-001); bileşen ve enerji birinci sınıf alan (K-24).
- **Yerel portlar:** 3000 başka projede açık olabilir; bu proje 3020 / 5436 (K-30). Testlerin doğru sunucuya koştuğunu `site.spec.ts` doğrular.
- **Next.js:** bu sürümün belgeleri `node_modules/next/dist/docs/` altında; API'den emin değilsen önce orayı oku.
- **Tasarım:** Rakım "Demleme Defteri", akşam takımı "Gece defteri" (plan §11); platform ve panel §11.8. Arayüz işi 1440 ve 390 px ekran görüntüsüne bakılarak kapanır.

## Kurallar

> **Sistem:** web-proje v1.2.0 · **Son güncelleme:** 2026-10-30
> Bu dosya her projenin `AGENTS.md`'sine aynen gömülür. Kısa tutulur (hedef < 120 satır). Ayrıntı `docs/standartlar/` altındadır.

## A. Çalışma biçimi

1. **Plan anayasadır.** `docs/proje-plani.md` tek doğru kaynaktır. Plana aykırı bir şey yapılacaksa önce plan güncellenir (K- kararı), sonra kod yazılır.
2. **Önce plan, sonra kod.** Her dilimin başında dokunulacak dosyalar ve adımlar `docs/ilerleme.md`'ye yazılır. Planda olmayan kütüphane sorulmadan eklenmez.
3. **Dikey dilim.** Bir özellik; veri, sunucu, ekran (mobil + masaüstü), test ve belgesiyle birlikte biter. "Önce tüm tablolar, sonra tüm ekranlar" yapılmaz.
4. **Mobilde doğrulanmamış iş bitmemiştir.** Her bileşen önce 360 px için yazılır, sonra büyütülür. "Masaüstünü bitir, sonra mobile uyarla" yasaktır.
5. **Varsay, yaz, devam et.** Kritik belirsizlikte en fazla 5 kısa soru (yalnızca Faz 0). Cevap yoksa makul varsayım yapılır ve planın "Varsayımlar" bölümüne yazılır.
6. **Kapsam kontrollü büyür.** Yeni fikir plana P2 olarak yazılır; seviye zaman kutusunu aşan iş onaysız eklenmez ([karar mantığı](docs/standartlar/00-karar-mantigi.md)).
7. **Her dilim sonunda** `docs/ilerleme.md` güncellenir: ne bitti, ne kaldı, öğrenilen ders (tek "Dersler" bölümünün sonuna).
8. **Görünüme bakılmadan arayüz işi bitmez.** Plan §11'deki konsept her tasarım kararının ölçütüdür. Arayüze dokunan dilim, 1440 ve 390 px ekran görüntüsü açılıp profesyonel görünüm çıtasına (GK maddeleri) göre incelenmeden kapanmaz ([20-gorsel-kalite](docs/standartlar/20-gorsel-kalite.md)).

## B. Varsayılan teknoloji yığını (değişmezse sorulmaz)

Next.js (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui · PostgreSQL (Neon; yerelde Docker) · Drizzle ORM · Zod (istemci + sunucu aynı şema) · Better Auth (hesap gerekiyorsa) · Resend · MapLibre GL · Motion · date-fns · Vitest · Playwright · pnpm · Vercel. Sapma gerekirse ADR yazılır ([01-teknoloji-yigini](docs/standartlar/01-teknoloji-yigini.md)).

## C. Her projede zorunlu kalite

| Konu | Kural |
|---|---|
| Mobil | Mobil öncelikli CSS; 360–1536 px'te yatay kaydırma yok; dokunma hedefi ≥ 44 × 44 px; telefonda tablo yerine kart; giriş alanları ≥ 16 px. |
| Türkçe | Arayüz Türkçe, kod/commit/veritabanı adları İngilizce. `<html lang="tr">`. Harf dönüşümü ve sıralama `tr-TR` ile. Değişken değere Türkçe ek getirilmez ("Ankara'ya" değil "Hedef: Ankara"). |
| Biçimler | Para kuruş cinsinden tam sayı saklanır, `1.234,56 ₺` gösterilir. Zaman UTC saklanır, `Europe/Istanbul` gösterilir. Telefon E.164 saklanır, `0532 123 45 67` gösterilir. Biçimlendirme yalnızca `lib/format` ile. |
| Doğrulama | Tek Zod şeması; sunucu her girdiyi yeniden doğrular. Formun ilk yükünde HTML kısıtları + sunucudan dönen alan hataları; şema istemciye yalnızca gerekiyorsa ilk etkileşimde ayrı parça olarak iner ([12 §4](docs/standartlar/12-performans.md#4-render-ve-veri)). |
| Güvenlik | Her sunucu eylemi: doğrulama + yetki + gerekiyorsa hız sınırı. Sahiplik kontrolü (başkasının kaydına erişim) testli. Gizli bilgi kodda ve depoda yok. |
| Erişilebilirlik | WCAG 2.2 AA hedefi: klavyeyle tam kullanım, görünür odak, etiketli alanlar, yeterli kontrast, `prefers-reduced-motion`. |
| Yasal | Kişisel veri toplayan her formda aydınlatma bağlantısı ve onay kaydı. Onay verilmeden izleme betiği yüklenmez. Yasal metinler şablondur, hukuki inceleme ister. |
| SEO | Herkese açık her sayfada title (son ekle birlikte ≤ 60), description, canonical, Open Graph ve uygun JSON-LD. Demo sitelerde `noindex`. Belirteçli / imzalı sayfalar: `noindex` + `no-referrer` başlığı + canlı robots'ta kapalı. |
| Durumlar | Her ekranın yükleniyor, boş ve hata durumu tasarlanır. Form hatasında girilen veri kaybolmaz. |
| Görsel | Konsept planda adlı ve tanımlı. Telefonda da ilk ekranda baskın bir görsel. Görsel ekranda büyütülmez (dosyanın gerçek pikseli, kapladığı ekran pikselinin en az %80'i); kaynağı kayıtlı, seri tutarlı. Tek hâkim renk; vurgu ≤ %10. |
| Demo | `DEMO_MODE=true` iken dış kanallar (e-posta, SMS, WhatsApp API, ödeme) gerçek gönderim yapmaz, "demo kutusuna" yazar. Kurgusal içerik açıkça işaretlenir. İşletmenin telefonu ve WhatsApp hattı geliştiricinin numarasıdır: `0542 311 58 88`; kurgusal kişilerin numaraları `000` blokta. Rapor / takvim gösteren projede tohum sabit desenli 8–12 haftalık geçmiş üretir. |
| İmza | Her sitenin alt bilgisinin son satırında "Created by Talha Keskin", sitenin etiket stiliyle (`site-credit.tsx`). |

## D. Asla yapma

- `.env*` dosyasını, anahtarı, parolayı depoya koyma.
- `any` kullanma; dış veriyi `unknown` alıp Zod ile daralt.
- Tutarı `Number()`/`parseFloat()` ile ayrıştırma, kayan noktayla hesaplama; `lib/money` kullan.
- Argümansız `toLocaleLowerCase()`, `toLocaleUpperCase()`, `localeCompare()` kullanma.
- Görüntülenecek metni JS ile büyük harfe çevirme; büyük harf yalnızca CSS ile ve kısa etiketlerde.
- `dangerouslySetInnerHTML` kullanma (yalnızca sunucuda temizlenmiş zengin metin için tek yardımcı bileşen istisnadır).
- Migration'sız şema değişikliği yapma; canlıda `drizzle-kit push` kullanma.
- Test yazmadan yetki, sahiplik veya ödeme kodu değiştirme.
- `transform` ve `opacity` dışında bir özelliği animasyonla değiştirme.
- Lorem ipsum, gerçek kişi verisi, gerçek marka logosu, lisansı belirsiz görsel kullanma.
- Elle `srcset` yazma, görseli doğal boyutundan büyük gösterme, aynı görseli sitede iki rolde kullanma.
- Bölümleri farklı pastel tonlarla renk kodlama; degrade leke, parıltı süsü, cam efekti ekleme (konsept açıkça istemedikçe).
- Sayfa içine "örnek numara", "(örnek adres)" gibi yer tutucular serpiştirme; demo notu şerit, alt bilgi ve yasal metinlerde durur.
- Kurgusal yorumlar için `Review` / `AggregateRating` yapılandırılmış verisi basma.
- Kullanıcıyı hesap açmaya zorlama (hesap modeli planda D değilse).
- Çerez onayı olmadan analitik, piksel veya harita dışı üçüncü taraf betik yükleme.
- `console.log` bırakma; yorum satırına alınmış kod bırakma; numarasız `TODO` yazma.

## E. Nereye bakmalı

| Görev | Önce oku |
|---|---|
| Yeni ekran / bileşen | [06-arayuz](docs/standartlar/06-arayuz.md), [07-mobil](docs/standartlar/07-mobil.md), [08-erisilebilirlik](docs/standartlar/08-erisilebilirlik.md) |
| Konsept, görsel seçimi, görsel inceleme | [20-gorsel-kalite](docs/standartlar/20-gorsel-kalite.md) |
| Tablo, migration, seed | [04-veri](docs/standartlar/04-veri.md), [17-icerik-ve-demo-verisi](docs/standartlar/17-icerik-ve-demo-verisi.md) |
| Form, sunucu eylemi, API | [05-sunucu-ve-api](docs/standartlar/05-sunucu-ve-api.md), [11-guvenlik](docs/standartlar/11-guvenlik.md) |
| Herkese açık sayfa | [09-seo](docs/standartlar/09-seo.md), [12-performans](docs/standartlar/12-performans.md) |
| Form, çerez, üyelik, ödeme | [10-yasal-ve-kvkk](docs/standartlar/10-yasal-ve-kvkk.md) |
| Yönetim paneli | [13-yonetim-paneli](docs/standartlar/13-yonetim-paneli.md) |
| Test | [14-test](docs/standartlar/14-test.md) |
| Commit, PR, CI | [15-git-ve-ci](docs/standartlar/15-git-ve-ci.md) |
| Ortam, yayın, demo → canlı | [16-ortamlar-ve-yayin](docs/standartlar/16-ortamlar-ve-yayin.md) |
| Belge, numara, ADR | [18-dokumantasyon](docs/standartlar/18-dokumantasyon.md) |
| Portfolyo çıktıları | [19-portfolyo](docs/standartlar/19-portfolyo.md) |
| Bir işin bitip bitmediği | `docs/kalite-kapilari.md` |
| Next.js API'si (sürüme özgü) | `node_modules/next/dist/docs/`; eğitim verisindeki eski API'ye güvenme |
