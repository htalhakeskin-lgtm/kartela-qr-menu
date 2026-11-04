# İlerleme — Kartela: Çok Mekânlı QR Menü Platformu

> **Son güncelleme:** 2026-11-04 · **Faz:** 4 (Faz 1 dilimleri) · **Sıradaki dilim:** D-02

## Şu an

- **Etkin dilim:** D-01 — Kiracı yönlendirme ve tema rota iskeleti · ✅ (PR #2; üretim doğrulaması yayından sonra)
- **Son yapılan:** D-01: mekân kaydı, alan adı koşullu yeniden yazma kuralları (K-39, ADR-0002 v2), önizleme çerezi ve yol öneki, Sade ağacı iskeleti + fikstür mekân (RTL), mekân başına robots / sitemap / manifest; 19 birim + 10 e2e yeni test.
- **Sıradaki adım:** D-02 — veri çekirdeği ve kiracı yalıtımı: `venues`, `venue_domains`, `venue_members`, `venue_settings` + RLS + bileşik FK; ilk iş `withVenue()` ve kiracı test takımının iskeleti; Neon önizleme dallanmasını doğrula.

## Gözetimsiz çalışma notları

- 2026-11-04 — Faz 0–2'de soru sorulmadı; brif sabit kararları verdi. Belirsizlikler Q-01…Q-05 olarak onaya taşındı ve kapandı (K-21…K-26).
- 2026-11-04 — Faz 3: `kartela.vercel.app` başkasına ait çıktı; K-26 kalıbı platformun kendisine uymadığı için `kartela-platform.vercel.app` seçildi (K-38). Port 3000'de başka bir projenin sunucusu çalıştığı için yerel port 3020 (K-30).
- 2026-11-04 — Faz 3: ilk Git yayını `chore/scaffold` dalından "Production" hedefiyle geldi (Levha'daki gibi); `main` birleşince yerini alır.

## Faz 3 kurulum kaydı

| Konu | Sonuç |
|---|---|
| Sürümler | Next.js 16.4.3 (3 günden eski en yeni; 16.4.3 için yayımlanmış açık yok), React 19.3.1, TypeScript 6.0.3, Tailwind 4.3.3, Better Auth 1.7.14, Drizzle 0.45.4, Zod 4.6.7, Vitest 5.0.5, Playwright 1.64.1, pnpm 12.6.0, Node 24 |
| Yapı | Çok kök düzen: `(platform)` + `tema-rakim/[mekan]/[dil]` (ADR-0003); `global-not-found` kendi kendine yeter (K-32, K-35) |
| Veri | `platform_settings`, `audit_logs` (+`venue_id`), `demo_outbox` (+`venue_id`), `action_rate_limits` + Better Auth (`users.platform_role`); `site_settings`, `leads`, `consent_records` yok (K-07, K-15). Yerel PostgreSQL 18 (5436) ve Neon (Frankfurt, ücretsiz) migration + tohum |
| Denetimler | `pnpm check` (lint, typecheck, biçim, 38 birim testi) · `pnpm build` · `pnpm test:e2e` 101 test · `pnpm audit --audit-level=high` temiz (2 orta düzey bulgu yalnızca geliştirme araçlarında: drizzle-kit → esbuild, eslint → minimatch) |
| CI | GitHub Actions: static, test, e2e (+ Lighthouse CI), security — PR #1'de dördü de yeşil |
| Yayın | Vercel `talha-keskin/kartela` (fra1, Node 24, Next.js ön ayarı), Neon Marketplace `kartela-db`; alan adları `kartela-platform.vercel.app`, `rakim-kahve.vercel.app`, `kepce-lokanta.vercel.app` (bağlı; mekân yönlendirmesi D-01'de) |
| Sistem dosyaları | `docs/standartlar/` (22), `docs/kalite-kapilari.md` (S4 + projeye özgü), `.claude/rules/` (5), `AGENTS.md` (Next.js bloğu + kurallar), `CLAUDE.md`, PR şablonu, README, `content/yasal/` (3 metin, platforma göre) |

### RSK-01 ölçümü (K-27, K-37)

| Ölçüm | Değer |
|---|---|
| Çerçeve tabanı (istemci bileşensiz Rakım rotası, HTML'deki parçaların gzip toplamı) | **177 KB** (platform `/` 177 KB) — Levha'nın 165 KB'ından yüksek (Next.js 16.4.3 + React 19.3.1) |
| Lighthouse mobil, yerel, ilk ölçüm | Rakım **0,90** (LCP 3,6 sn: öne çıkan fotoğraf) · platform 0,95–0,96 |
| Bulgu 1 | `global-not-found.tsx`'in içe aktardığı platform CSS'i / Inter, her rotada `Link` başlığıyla ön yüklendi: Rakım 6 yazı tipi dosyası (221 KB) indiriyordu → kendi kendine yeten global 404 (K-35) → Rakım 4 dosya (88 KB), 0,94 |
| Bulgu 2 | Veri yazı tipinin (Plex Mono) ön yüklemesi kapatıldı (K-36) → Rakım **0,95 / 0,95 / 0,95** (FCP 1,1 sn, LCP 2,9 sn, TBT 50–100 ms, CLS 0) |
| CI (GitHub runner) | Menü sayfası 0,95 hata eşiği geçti |
| Canlı (Vercel CDN, 3 ölçüm) | Rakım **0,93 / 0,95 / 0,95** (FCP 0,9–1,0 sn, LCP 2,9–3,2 sn) · platform 0,98 |
| Sert hedef | İlk ürün adı ve fiyatı sunucu HTML'inde (e2e) ve FCP ≤ 1,5 sn: **tutuyor** (0,8–1,1 sn) |
| D-01 (mekân alan adı, ortanca koşu) | CI 0,93 · 0,95 · 0,99 (Lighthouse CI varsayılanı en iyi koşuyu aldı; 0,93 saklandı) · yerel ortanca ile 0,94 · 0,94 · 0,94 |
| Karar (D-01) | **K-27 uygulandı → K-40, ADR-0006:** performans < 0,90 hata, < 0,95 uyarı; FCP > 1,5 sn hata; kapılar ortanca koşuyla |
| Karar (Faz 3) | K-17 (0,95 hata) korunur; pay yok. CI ya da canlı ölçüm 0,95 altına düşerse K-27 yolu (ADR + 0,90 hata / 0,95 uyarı). Pay kaynağı: D-14'te Schibsted Grotesk `latin-ext` (47 KB) yerine yalnızca Türkçe harfler; D-15'te istemci adacıkları ilk etkileşimde |

## Dilimler

Efor: S = 1, M = 3, L = 6 puan. Faz 3 kurulumu bütçe dışıdır.

### Faz 1 — Altyapı ve ilk mekân (66 puan, P0)

Faz 1'in son dilimi (D-22) bitip Rakım yayına çıkınca durulur; teslim: yayın adresi, 1440 ve 390 px ekran görüntüleri, 30 sn telefon ekran kaydı, kısa rapor. Faz 2'yi kullanıcı onaylar (K-29).

| No | Dilim | Kapsam (özellik / REQ) | Efor | Öncelik | Durum | 360 px | Test |
|---|---|---|---|---|---|---|---|
| D-01 | Kiracı yönlendirme ve tema rota iskeleti: alan adı koşullu yeniden yazma kuralları (K-39, ADR-0002 v2), derleme anı mekân kaydı, `*.localhost`, `?mekan=`, `/m/{slug}`, bilinmeyen alan adı, `/tema-*` koruması, mekân başına `robots` / `sitemap` / manifest, Sade ağacı iskeleti + fikstür mekân | QR-01 · REQ-001 · SCR-051 | M | P0 | ✅ | ✅ | 20 birim (kayıt, kurallar) + 11 e2e (`tenant.spec.ts`) |
| D-02 | Veri çekirdeği ve kiracı yalıtımı: `venues`, `venue_domains`, `venue_members`, `venue_settings`; `withVenue`, bileşik FK, RLS, `app_rw` rolü; `audit_logs` / `demo_outbox` FK'leri; kiracı test takımı; `venueAction` | QR-02 · REQ-002 | M | P0 | ⏳ | — | — |
| D-03 | Menü motoru I: menüler ve pencereler, bölümler, ürünler, fiyat türleri, ürün bilgisi (14 alerjen, bileşen, enerji), çeviri alanları ve düşme | QR-03…06 · REQ-003…006 | M | P0 | ⏳ | — | — |
| D-04 | İçerik klasöründen tohum hattı: `content/mekanlar/{ad}/` (mekan.ts, menu.ts, hikayeler, gorseller.ts), Zod şemaları, `db:seed` / `db:reset`, görsel kaydı ve CDN loader, test fikstür mekânı | QR-03 · REQ-003 | M | P0 | ⏳ | — | — |
| D-05 | Menü motoru II: seçenek grupları, en az / en çok, fiyat farkı, uyumluluk kuralları, `domain/configurator.ts` | QR-07 · REQ-007 | M | P0 | ⏳ | — | — |
| D-06 | Menü motoru III: müsaitlik (tükendi, günlük adet, saatli çıkış, mevsim, günün menüsü) + ilişkiler (eşleşme, öneri, set, tadım) | QR-08, QR-09 · REQ-008, REQ-009 | M | P0 | ⏳ | — | — |
| D-07 | Keşfet içerik modeli: hikâye türleri, koleksiyon ve durak, Markdown (sunucuda `react-markdown`, K-34), galeri, ürün bağları | QR-10 · REQ-010 | M | P0 | ⏳ | — | — |
| D-08 | Tema sözleşmesi + görünümsüz çekirdek: `ThemeModule`, yuvalar, `useActiveMenus`, `useMenuSearch`, `useMenuFilters`, `useConfigurator`, `usePicks`, `useView`, `useVenueContext`, `formatPrice`, `t()`; ön boyama betiği | QR-11, QR-13 · REQ-011, REQ-013 | M | P0 | ⏳ | — | — |
| D-09 | Sade I: kabuk, hızlı menü (liste / kart / ızgara), yapışkan kategori çubuğu, arama, filtre paneli, alttan ürün paneli, alt çubuk | QR-12, QR-14 · REQ-012, REQ-014 · SCR-001, SCR-003 | M | P0 | ⏳ | — | — |
| D-10 | Sade II: Keşfet (akış / dergi), Seçtiklerim + garsona göster, RTL, koyu mod, fotoğrafsız ürün (birinci sınıf, K-23), baskı yuvaları, `/stil`, tema konformans takımı | QR-06, QR-13, QR-14 · REQ-006, REQ-013, REQ-014 · SCR-002, SCR-004, SCR-007 | M | P0 | ⏳ | — | — |
| D-11 | Mekân kabuğu: alan adı başına `metadataBase`, canonical, `hreflang`, JSON-LD, OG görseli, favicon; kip (demo notu, `noindex`); yasal blok; `/bilgi`; 404 | QR-15 · REQ-015 · SCR-005, SCR-008 | M | P0 | ⏳ | — | — |
| D-12 | Statik üretim + `updateTag` + günlük cron (04:00) + mekân başına `olcum:js` ve Lighthouse CI matrisi | QR-16 · REQ-016 | M | P0 | ⏳ | — | — |
| D-13 | Çevrimdışı: mekân kapsamlı servis çalışanı, `/cevrimdisi`, "son güncelleme" notu | QR-17 · REQ-017 · SCR-009 | M | P0 | ⏳ | — | — |
| D-14 | Rakım konsepti: görsel havuzu (3 kat aday + temas sayfası), `docs/gorsel-kaynaklari.md`, token'lar ve yazı tipleri (Türkçe alt küme, RSK-01 payı), `/stil`, içerik (menü + hikâyeler) | QR-18 · REQ-018 · SCR-007 | M | P0 | ⏳ | — | — |
| D-15 | Rakım teması: kabuk, ürün satırı ve öne çıkan ürün, ürün paneli, Keşfet (dergi), veri kartı yedeği, akşam takımı; imza hareketleri 2 ve 3 (K-28); Faz 3 ölçüm sayfasının yerini alır | QR-18 · REQ-018 · SCR-001…003 | M | P0 | ⏳ | — | — |
| D-16 | İmza: kahve özelleştirici (tarif kartı, canlı fiyat, uyumluluk); imza hareketi 1 (fiyat rakamı kayması) | QR-19 · REQ-019 · SCR-003 | M | P0 | ⏳ | — | — |
| D-17 | İmza: saate göre menü (üst çubuk), çekirdek kartları (rakım çizgisi), Keşfet demleme rehberi ve köken | QR-20 · REQ-020 · SCR-001…003 | M | P0 | ⏳ | — | — |
| D-18 | Panel temeli: kendi kök düzeni, Better Auth, 2FA, roller ve izinler, mekân seçici, pano iskeleti, ayarlar, ekip, işlem geçmişi; önizleme ortamında oturum | QR-21 · REQ-021 · SCR-100…102, SCR-117…119 | M | P0 | ⏳ | — | — |
| D-19 | Platform yöneticisi: mekân oluştur, alan adı bağla (Vercel API + Deploy Hook), tema ve kip seçimi, kullanıcılar | QR-21 · REQ-021 · SCR-130…132 | M | P0 | ⏳ | — | — |
| D-20 | Panel müsaitlik: tek dokunuş tükendi, günlük adet ±, fırından çıkış, günün menüsü (telefon öncelikli) | QR-08, QR-22 · REQ-008, REQ-022 · SCR-108, SCR-109 | M | P0 | ⏳ | — | — |
| D-21 | `pnpm mekan:yeni` (+ `tema:yeni`) ve `docs/yeni-mekan.md` (Vercel alan adı adımları dahil) | QR-23 · REQ-023 | M | P0 | ⏳ | — | — |
| D-22 | Mekân test matrisi: duman, ekran görüntüsü karşılaştırması (CI temel görüntüleri), Lighthouse, görsel kalite, paket ve yazı tipi yalıtımı; ortak kod değişince bütün mekânlar | QR-23 · REQ-023 | M | P0 | ⏳ | — | — |

### Faz 2 — Panel derinliği ve kanıt (57 puan)

| No | Dilim | Kapsam (özellik / REQ) | Efor | Öncelik | Durum | 360 px | Test |
|---|---|---|---|---|---|---|---|
| D-23 | Panel: menüler ve bölümler (pencereler, pencere dışı davranışı, sıralama) | QR-24 · REQ-024 · SCR-103, SCR-104 | M | P1 | ⏳ | — | — |
| D-24 | Panel: ürün düzenleme I (genel, fiyat türleri, ürün bilgisi, bileşen / enerji eksik raporu) | QR-24, QR-05 · REQ-024, REQ-005 · SCR-105, SCR-106 | M | P1 | ⏳ | — | — |
| D-25 | Panel: ürün düzenleme II (görsel seçimi, ilişkiler, set, tadım) | QR-24, QR-09 · REQ-024, REQ-009 · SCR-106 | M | P1 | ⏳ | — | — |
| D-26 | Panel: seçenek grupları ve uyumluluk kuralları (+ kural benzetimi) | QR-24, QR-07 · REQ-024 · SCR-107 | M | P1 | ⏳ | — | — |
| D-27 | Panel: hikâyeler (Markdown + önizleme, galeri, durak sırası) | QR-25 · REQ-025 · SCR-110 | M | P1 | ⏳ | — | — |
| D-28 | Medya kütüphanesi: yükleme (Blob, magic byte, `sharp` türevleri), stok kaydı, odak noktası, alt metin | QR-25 · REQ-025 · SCR-111 | M | P1 | ⏳ | — | — |
| D-29 | Panel: çeviriler (eksik alanlar, dil ekle / kaldır, RTL önizleme) | QR-26 · REQ-026 · SCR-112 | M | P1 | ⏳ | — | — |
| D-30 | Toplu fiyat + fiyat geçmişi + geri alma | QR-27 · REQ-027 · SCR-113 | M | P1 | ⏳ | — | — |
| D-31 | Bağlamlar + QR üretici + temalı QR kartları | QR-28 · REQ-028 · SCR-114, SCR-012 | M | P1 | ⏳ | — | — |
| D-32 | Kapı önü fiyat listesi + masa listesi (yazdırma, aynı veriden) | QR-29 · REQ-029 · SCR-010, SCR-011 | M | P0 | ⏳ | — | — |
| D-33 | İçe aktarma: CSV / XLSX şablon, doğrulama, önizleme, uygula | QR-30 · REQ-030 · SCR-115 | M | P1 | ⏳ | — | — |
| D-34 | Çerezsiz istatistik I: olay ucu (`sendBeacon`), toplama tabloları, hız sınırı, 10 haftalık tohum geçmişi | QR-31 · REQ-031 | M | P1 | ⏳ | — | — |
| D-35 | Çerezsiz istatistik II: panel raporları (ısı haritası, en çok bakılanlar, dil, sonuçsuz arama) + pano | QR-31 · REQ-031 · SCR-116, SCR-102 | M | P1 | ⏳ | — | — |
| D-36 | Önizleme: kaydetmeden telefon çerçevesinde mekân temasıyla | QR-32 · REQ-032 · SCR-120 | M | P1 | ⏳ | — | — |
| D-37 | Özel durumlar: şifreli gizli bölüm, bağlama göre menü ve token, gün dilimi token'ları (Rakım'da "Barista defteri" gizli bölümü) | QR-33 · REQ-033 · SCR-006 | M | P1 | ⏳ | — | — |
| D-38 | Platform tanıtım sayfası: vaka çalışması özeti, mekân vitrinleri, mimari şema (Faz 3 kabuğunun yerini alır) | QR-34 · REQ-034 · SCR-050 | M | P1 | ⏳ | — | — |
| D-39 | Deneme mekânı Kepçe, 1 iş günü kabul testi: (a) iki konsept + onay, görsel, içerik (CSV içe aktarma); (b) Sade yapılandırması, matris, inceleme, alan adı, yayın. Adım süreleri `docs/yeni-mekan.md`'ye | QR-35 · REQ-035 | L (2 × M) | P0 | ⏳ | — | — |
| D-40 | Cila: performans ince ayarı, boş durumlar, mikro metinler, hareket | — | M | P1 | ⏳ | — | — |

**Kapsam izlenebilirliği:** Plan §5'teki her P0 / P1 özellik ve §6'daki her P0 ekran aşağıdaki dilimlerden birine bağlıdır. Faz 2 sonunda ve Faz 5 başında denetlenir; dilimsiz satır varsa yeni dilim açılır.

| Plan satırı | Dilim |
|---|---|
| REQ-001 / QR-01 / SCR-051 | D-01 (SCR-051 Faz 3'te `global-not-found`) |
| REQ-002 / QR-02 | D-02 |
| REQ-003 / QR-03 | D-03, D-04 |
| REQ-004 / QR-04 | D-03 |
| REQ-005 / QR-05 | D-03, D-24 |
| REQ-006 / QR-06 | D-03, D-10 |
| REQ-007 / QR-07 | D-05, D-26 |
| REQ-008 / QR-08 | D-06, D-20 |
| REQ-009 / QR-09 | D-06, D-25 |
| REQ-010 / QR-10 | D-07, D-10, D-15 |
| REQ-011 / QR-11 | D-08 |
| REQ-012 / QR-12 | D-09 |
| REQ-013 / QR-13 | D-08, D-10 |
| REQ-014 / QR-14 | D-09, D-10 |
| REQ-015 / QR-15 | D-11 |
| REQ-016 / QR-16 | D-12 |
| REQ-017 / QR-17 | D-13 |
| REQ-018 / QR-18 | D-14, D-15 |
| REQ-019 / QR-19 | D-16 |
| REQ-020 / QR-20 | D-17 |
| REQ-021 / QR-21 | D-18, D-19 |
| REQ-022 / QR-22 | D-20 |
| REQ-023 / QR-23 | D-21, D-22 |
| REQ-024 / QR-24 | D-23…D-26 |
| REQ-025 / QR-25 | D-27, D-28 |
| REQ-026 / QR-26 | D-29 |
| REQ-027 / QR-27 | D-30 |
| REQ-028 / QR-28 | D-31 |
| REQ-029 / QR-29 | D-32 |
| REQ-030 / QR-30 | D-33 |
| REQ-031 / QR-31 | D-34, D-35 |
| REQ-032 / QR-32 | D-36 |
| REQ-033 / QR-33 | D-37 |
| REQ-034 / QR-34 | D-38 |
| REQ-035 / QR-35 | D-39 |
| SCR-001 Hızlı menü (P0) | D-09, D-15 |
| SCR-002 Keşfet (P0) | D-10, D-15, D-17 |
| SCR-003 Ürün detayı (P0) | D-09, D-15, D-16 |
| SCR-004 Seçtiklerim (P0) | D-10 |
| SCR-005 Bilgi (P0) | D-11 |
| SCR-007 Stil (P0) | D-10, D-14 (platform `/stil` Faz 3'te) |
| SCR-008 404 (P0) | D-11 |
| SCR-009 Çevrimdışı (P0) | D-13 |
| SCR-010, SCR-011 Baskılar (P0) | D-32 |
| SCR-051 Bilinmeyen alan adı (P0) | D-01 |
| SCR-100…102 Giriş, 2FA, pano (P0) | D-18 |
| SCR-108, SCR-109 Müsaitlik, günün menüsü (P0) | D-20 |
| SCR-117…119 Ayarlar, ekip, geçmiş (P0) | D-18 |
| SCR-130…132 Platform (P0) | D-19 |

## Etkin dilim planı

**D-01 — Kiracı yönlendirme ve tema rota iskeleti** (dal `feat/d01-tenant-routing`)
- Kabul kriterleri (REQ-001, BR-KRC-004): `rakim.localhost:3020` Rakım'ı, `ornek.localhost:3020` fikstür mekânı (Sade) açar; `/ar` sağdan sola; `localhost:3020/?mekan=rakim` çerez yazar, parametresiz adrese döner ve sonraki istekler Rakım'ı gösterir; `?mekan=` boş → çerez silinir; `/m/rakim/` yol önekiyle açılır ve `X-Robots-Tag: noindex`; tanınmayan alan adı (`foo.localhost`) 404; `/tema-*` iç yolları dışarıdan 404; `/_next/*` ve `/api/*` mekân alan adlarında da yeniden yazılmaz; mekân başına `robots.txt`, `sitemap.xml`, `manifest.webmanifest`; `/api/health` mekân haritasının sürümünü döner.
- Mimari değişiklik (K-39, ADR-0002 v2): çözümleme `proxy.ts` yerine `next.config.ts` `rewrites.beforeFiles` alan adı koşullu kurallarıyla; kurallar derleme anında mekân kaydından üretilir. Gerekçe: Next.js 16 proxy'si yalnızca Node.js çalışma ortamında çalışır; her menü isteği CDN'den önce fonksiyon çağırırdı. `proxy.ts` yalnız panelde kalır.
- Tablolar / migration: yok (mekân kaydı D-01'de `content/mekanlar/*/mekan.ts`; D-02 veritabanına taşır, D-19 alan adı bağlamayı ekler).
- Dosyalar: `src/platform/tenant/{registry-schema,registry,rewrites}.ts` (+ testler), `content/mekanlar/{index,rakim/mekan,_ornek/mekan}.ts`, `next.config.ts`, `src/proxy.ts`, `src/app/api/onizleme/route.ts`, `src/app/api/health/route.ts`, `src/platform/routes/venue-files.ts`, `src/app/tema-rakim/[mekan]/{robots.txt,sitemap.xml,manifest.webmanifest}/route.ts`, `src/app/tema-sade/[mekan]/[dil]/{layout,page}.tsx` + aynı dosya rotaları, `src/themes/sade/sade.css`, `src/app/global-not-found.tsx`.
- Kurallar: BR-KRC-004.
- Testler: birim — kayıt doğrulaması, kural üretimi ve Next'in kendi test aracıyla (`unstable_getResponseFromNextConfig`) kural davranışı; e2e — `tenant.spec.ts` (alan adları, yol öneki, önizleme çerezi, bilinmeyen alan adı, iç yol koruması, dosya rotaları); mevcut testler mekân adresleriyle (`rakim.localhost`) koşar; Lighthouse URL'leri mekân alan adına taşınır.
- Yönetim kılavuzu: — (panel modülü yok)
- Notlar: Rakım'ın kaydında şimdilik yalnızca `tr` (EN içerikle D-14'te); fikstür mekân `_ornek` üretim haritasına girmez (`VERCEL_ENV=production`). Mekâna özgü 404 sayfası D-11'de.

## Görsel inceleme

| Tarih | Dilim / sayfa | GK maddesi | Bulgu | Durum |
|---|---|---|---|---|
| 2026-11-04 | Faz 3 / `/stil` (1440, 390) | GK-05, GK-08 | Platform token'ları: tek hâkim renk (derin yeşil), nötrler; ölçek 12…60 px; Türkçe karakterler doğru | ✅ |
| 2026-11-04 | Faz 3 / platform `/` 1440 | GK-01, GK-11, GK-17 | Tipografik başlık + üç tema kartı (aynı menü, üç görünüm); iki bölüm farklı düzende; ikonlu "neden biz" kartı yok | ✅ |
| 2026-11-04 | Faz 3 / platform `/` 390 | GK-01 | Telefonda ilk ekranda görsel yok: tema kartları kaydırınca geliyor. Kabuk sayfası; D-38'de tanıtım sayfası baskın görselle yeniden kurulur | ❌ D-38'e |
| 2026-11-04 | Faz 3 / Rakım ölçüm sayfası 390 | GK-01, GK-05, GK-08 | Konsepte uygun: kâğıt zemin, mürekkep, monospace veri satırı; vurgu yalnızca etkin saatte; öne çıkan ürün tam genişlik (K-05) | ✅ |
| 2026-11-04 | Faz 3 / Rakım ölçüm sayfası 390 | GK-11, GK-13 | Küçük görselli satırda fiyat, görselsiz satırdaki fiyatla aynı hizada değil (görsel sütunu fiyatı içeri itiyor). D-15'te fiyat ve küçük görsel düzeni tek ızgaraya bağlanır; görselsiz satırlarda veri kartı yedeği (K-23) | ❌ D-15'e |
| 2026-11-04 | Faz 3 / Rakım ölçüm sayfası 1440 | GK-12, GK-13 | Masaüstünde tek 720 px sütun, kenarlar boş; §11.4'teki sol yapışkan kategori dizini (240 px) D-15'te | ❌ D-15'e |
| 2026-11-04 | D-01 / `rakim.localhost` 390 | — | Mekân alan adı üzerinden Faz 3 görünümüyle birebir; yönlendirme görünümü değiştirmiyor | ✅ |
| 2026-11-04 | D-01 / `ornek.localhost/ar` 390 | RTL | `dir="rtl"`: başlık ve ürün adları sağda, fiyatlar solda; Türkçe demo notu RTL bağlamda noktayı başa kaydırıyordu → `dir="ltr"` | ✅ düzeltildi |
| 2026-11-04 | D-01 / Sade fikstür sayfası | GK-01 | İskelet sayfa, görsel yok: yalnızca test mekânı, üretimde yok; Sade D-09'da | — kabul (fikstür) |

## Kalite kapısı raporu

— (Faz 5'te)

## Bilinen sorunlar

- `kepce-lokanta.vercel.app` projeye bağlı ama mekân kaydında yok (Kepçe D-39'da kaydedilir); o zamana kadar `*.vercel.app` kuralıyla platform ana sayfasını gösterir.
- Mekâna özgü 404 sayfası yok: mekân alan adında bilinmeyen yol global 404'ü (Kartela) gösterir; D-11'de mekânın kendi 404'ü.
- Rakım ölçüm sayfasındaki "TR · EN" yalnızca metin (dil seçici değil); EN içerikle D-14, dil seçici D-15.
- Önizleme dalları için Neon dal ayrımı (PR başına veritabanı dalı) henüz doğrulanmadı; şimdilik önizleme ve üretim aynı Neon veritabanını görüyor. D-02'de (ilk tablo değişikliği) Vercel–Neon önizleme dallanması açılır ya da doğrulanır.
- `pnpm audit`: iki orta düzey bulgu yalnızca geliştirme araçlarında (drizzle-kit → esbuild ≤ 0.24.2, eslint → minimatch < 11.0.1); yükseltme yolu çıkınca kapatılır.

## Dersler

- 2026-11-04 · Plan · Brifteki iki varsayım güncel kaynakla çelişti (servis ücreti gösterimi → Ocak 2026'da yasak; Vercel görsel kotası "proje başına" sanılıyordu → hesap başına). Yasal ve kota maddelerinin araştırmada resmî kaynakla doğrulanması plana doğrudan yön verdi. **Sisteme taşı:** sektör modülü `restoran-otel.md` §8'e RG 33153 ve 2026 bileşen / enerji takvimi; 16 §6'ya "Hobby kotaları ekip başınadır" notu.
- 2026-11-04 · Plan · Katalogda çok kiracılı platform ve QR menü için sektör modülü yok; `QR-` önekiyle 37 özellik tanımlandı. **Sisteme taşı:** Faz 8'de `katalog/sektorler/qr-menu-platformu.md` önerisi.
- 2026-11-04 · Faz 3 · Çok kök düzenli uygulamada `global-not-found.tsx` (ve `global-error.tsx`) her rotanın girişine giriyor; içe aktardığı CSS ve `next/font` bütün rotalarda `Link` başlığıyla ön yükleniyor. Rakım menüsü platformun Inter'ini indiriyordu (+132 KB, LCP 3,6 sn). Çözüm: bu iki dosya kendi kendine yeter (satır içi stil, sistem yazı tipi); `next-font-manifest.json`'da rota başına yazı tipi sayısı denetlenir. **Sisteme taşı:** iskelet (çok kök düzen notu), 12 §6, 06 (yazı tipi).
- 2026-11-04 · Faz 3 · Rota grubunun içindeki meta görsel dosyaları (`opengraph-image`, `icon`) karmalı adres alıyor (`/opengraph-image-1tixr7`); `pageMetadata()`'nın sabit `/opengraph-image` varsayılanı 404 verdi (seo.spec yakaladı). Çözüm: paylaşım görseli rota işleyicisinde sabit adreste (`/og/platform`), simge `public/`. **Sisteme taşı:** iskelet `seo.ts`, 09 (SEO-06).
- 2026-11-04 · Faz 3 · Vercel'de `vercel project add` ile açılan projenin çatı ayarı boş (statik "Other") kalıyor ve Node 26.x seçiliyor; ilk yayın her adreste 404 verdi. Çözüm: `PATCH /v9/projects/{ad}` ile `framework: nextjs`, `nodeVersion: 24.x`, sonra yeniden yayın. Levha'daki diğer CLI yan etkileri (`.gitignore`'a `.env*`, `.vercel` ekleme; ilk Git yayınının dal üzerinden "Production" gelmesi) tekrarlandı. **Sisteme taşı:** 16 §6 "Vercel CLI" sırası (D-024 ile birlikte).
- 2026-11-04 · Faz 3 · `upload-artifact` gizli klasörleri (`.lighthouseci`) varsayılan olarak yüklemiyor; CI'da Lighthouse geçti ama rapor kayboldu. Çözüm: `include-hidden-files: true`. **Sisteme taşı:** iskelet `ci.yml`.
- 2026-11-04 · Faz 3 · Statik sayfa CSP'sine betik özeti eklemek `'unsafe-inline'`'ı geçersiz kılar ve Next.js'in nonce'suz satır içi betiklerini kırar (ADR-0005 ilk taslağındaki hata, K-33). **Sisteme taşı:** 11 §8 notu.
- 2026-11-04 · Faz 3 · Next.js 16.4.3 + React 19.3.1 çerçeve tabanı 177 KB gzip (Levha'da 16.4.2 ile 165 KB). Mobil Lighthouse ≥ 0,95 hedefinde payı yazı tipi baytları belirliyor: veri yazı tipinin ön yüklemesini kapatmak LCP görseline bant genişliği bıraktı (0,94 → 0,95). **Sisteme taşı:** 12 §3 taban değeri, 06 yazı tipi ön yükleme kuralı.
- 2026-11-04 · D-01 · Next.js 16 `proxy.ts` yalnız Node.js çalışma ortamında çalışıyor; alan adına göre kiracı yönlendirmesini proxy'ye koymak Vercel'de her statik menü isteğine fonksiyon çağrısı ekleyecekti. `next.config` `beforeFiles` kuralları (`has: host`) aynı derleme anı haritasını yönlendirme katmanında uyguluyor. Tuzaklar: (1) `beforeFiles` zincirlenir, sonraki kurallar yeniden yazılmış yolu görür → iç yol öneki (`tema-`) dışlanmalı; (2) `unstable_getResponseFromNextConfig` ilk eşleşen kuralı döndürür, zinciri taklit etmez → gerçek zincir e2e ile sınanmalı; (3) yeniden yazılmış istekte rota işleyicisi özgün adresi görür; (4) sorgu koşulunda boş değer "parametre yok" sayılır. **Sisteme taşı:** 02-mimari (çok kiracılı yönlendirme kalıbı), 05 (yeniden yazma + rota işleyicisi), katalog `qr-menu-platformu`.
- 2026-11-04 · D-01 · İki kör nokta Lighthouse'ın en iyi uygulamalar puanıyla yakalandı: (1) `/tema-*` iç yol koruması, Next.js'in meta görsellerini sunduğu adresi de (`/tema-rakim/-/-/icon.svg`) kapattı, simge 404 verdi; çözüm meta görsel adlarını kuraldan muaf tutmak + e2e'de "sayfanın simgesi yükleniyor" testi. (2) Lighthouse CI kategori kapılarını varsayılan olarak üç koşunun **en iyisine** göre değerlendiriyor; 0,93'lük koşu 0,99'un arkasında saklandı. Çözüm `aggregationMethod: "median-run"`. **Sisteme taşı:** iskelet `lighthouserc.js` (ortanca koşu), 12 §8.
- 2026-11-04 · D-01 · İlk `main` yayını hata verdi: üretim derlemesi fikstür mekânları haritadan çıkarıyor, yalnız fikstürün kullandığı Sade ağacında `generateStaticParams` boş döndü ve Cache Components derlemeyi durdurdu ("must return at least one result"). CI fikstürlü derlediği için yakalayamadı. Çözüm: mekânı olmayan tema ağacı 404 veren tek yer tutucu parametre döndürür; CI'da `VERCEL_ENV=production` ile ikinci derleme. Başarısız yayınlar canlıyı değiştirmedi (önceki yayın açık kaldı). **Sisteme taşı:** 15 (CI: üretim ortamı değişkenleriyle derleme), 12 / 02 (Cache Components + boş statik parametre).
