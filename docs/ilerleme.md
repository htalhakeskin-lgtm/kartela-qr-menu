# İlerleme — Kartela: Çok Mekânlı QR Menü Platformu

> **Son güncelleme:** 2026-11-04 · **Faz:** 2 (plan onay bekliyor) · **Sıradaki dilim:** Faz 3 kurulum, ardından D-01

## Şu an

- **Etkin dilim:** — (plan onayı bekleniyor)
- **Son yapılan:** Faz 0–2: brif, araştırma ([arastirma.md](arastirma.md)), ADR-0001…0005, plan ([proje-plani.md](proje-plani.md)) ve dilim listesi.
- **Sıradaki adım:** Kullanıcı onayı (konsept A / B, Q-01…Q-05) → `/web-proje kur`: iskelet, çok kök düzenli yapı, boş Sade ve Rakım tema rotalarında çerçeve tabanı + Lighthouse ölçümü (RSK-01 erken sinyali).

## Gözetimsiz çalışma notları

- 2026-11-04 — Soru sorulmadı; brif sabit kararları verdi. Belirsizlikler plan §22'de Q-01…Q-05 olarak onay özetine taşındı.

## Dilimler

Efor: S = 1, M = 3, L = 6 puan. Faz 3 kurulumu bütçe dışıdır.

### Faz 1 — Altyapı ve ilk mekân (66 puan, P0)

| No | Dilim | Kapsam (özellik / REQ) | Efor | Öncelik | Durum | 360 px | Test |
|---|---|---|---|---|---|---|---|
| D-01 | Kiracı yönlendirme ve tema rota iskeleti: `proxy.ts`, derleme anı alan adı haritası, `*.localhost`, `?mekan=`, `/m/{slug}`, bilinmeyen alan adı, `/tema-*` koruması, çok kök düzen, mekân başına `robots` / `sitemap` / manifest iskeleti | QR-01 · REQ-001 · SCR-051 | M | P0 | ⏳ | — | — |
| D-02 | Veri çekirdeği ve kiracı yalıtımı: `venues`, `venue_domains`, `venue_members`, `venue_settings`, `platform_settings`; `withVenue`, bileşik FK, RLS, `app_rw` rolü; kiracı test takımı | QR-02 · REQ-002 | M | P0 | ⏳ | — | — |
| D-03 | Menü motoru I: menüler ve pencereler, bölümler, ürünler, fiyat türleri, ürün bilgisi (14 alerjen, bileşen, enerji), çeviri alanları ve düşme | QR-03…06 · REQ-003…006 | M | P0 | ⏳ | — | — |
| D-04 | İçerik klasöründen tohum hattı: `content/mekanlar/{ad}/` (mekan.ts, menu.ts, hikayeler, gorseller.ts), Zod şemaları, `db:seed` / `db:reset`, görsel kaydı ve CDN loader, test fikstür mekânı | QR-03 · REQ-003 | M | P0 | ⏳ | — | — |
| D-05 | Menü motoru II: seçenek grupları, en az / en çok, fiyat farkı, uyumluluk kuralları, `domain/configurator.ts` | QR-07 · REQ-007 | M | P0 | ⏳ | — | — |
| D-06 | Menü motoru III: müsaitlik (tükendi, günlük adet, saatli çıkış, mevsim, günün menüsü) + ilişkiler (eşleşme, öneri, set, tadım) | QR-08, QR-09 · REQ-008, REQ-009 | M | P0 | ⏳ | — | — |
| D-07 | Keşfet içerik modeli: hikâye türleri, koleksiyon ve durak, Markdown → güvenli HTML, galeri, ürün bağları | QR-10 · REQ-010 | M | P0 | ⏳ | — | — |
| D-08 | Tema sözleşmesi + görünümsüz çekirdek: `ThemeModule`, yuvalar, `useActiveMenus`, `useMenuSearch`, `useMenuFilters`, `useConfigurator`, `usePicks`, `useView`, `useVenueContext`, `formatPrice`, `t()`; ön boyama betiği | QR-11, QR-13 · REQ-011, REQ-013 | M | P0 | ⏳ | — | — |
| D-09 | Sade I: kabuk, hızlı menü (liste / kart / ızgara), yapışkan kategori çubuğu, arama, filtre paneli, alttan ürün paneli, alt çubuk | QR-12, QR-14 · REQ-012, REQ-014 · SCR-001, SCR-003 | M | P0 | ⏳ | — | — |
| D-10 | Sade II: Keşfet (akış / dergi), Seçtiklerim + garsona göster, RTL, koyu mod, fotoğrafsız ürün, baskı yuvaları, `/stil`, tema konformans takımı | QR-06, QR-13, QR-14 · REQ-006, REQ-013, REQ-014 · SCR-002, SCR-004, SCR-007 | M | P0 | ⏳ | — | — |
| D-11 | Mekân kabuğu: alan adı başına `metadataBase`, canonical, `hreflang`, JSON-LD, OG görseli, favicon; kip (demo şeridi, `noindex`); yasal blok; `/bilgi`; 404 | QR-15 · REQ-015 · SCR-005, SCR-008 | M | P0 | ⏳ | — | — |
| D-12 | Statik üretim + `updateTag` + günlük cron (04:00) + CSP özeti + mekân başına `olcum:js` ve Lighthouse CI matrisi | QR-16 · REQ-016 | M | P0 | ⏳ | — | — |
| D-13 | Çevrimdışı: mekân kapsamlı servis çalışanı, `/cevrimdisi`, "son güncelleme" notu | QR-17 · REQ-017 · SCR-009 | M | P0 | ⏳ | — | — |
| D-14 | Rakım konsepti: görsel havuzu (3 kat aday + temas sayfası), `docs/gorsel-kaynaklari.md`, token'lar ve yazı tipleri, `/stil`, içerik (menü + hikâyeler) | QR-18 · REQ-018 · SCR-007 | M | P0 | ⏳ | — | — |
| D-15 | Rakım teması: kabuk, ürün satırı ve öne çıkan ürün, ürün paneli, Keşfet (dergi), veri kartı yedeği, akşam token takımı | QR-18 · REQ-018 · SCR-001…003 | M | P0 | ⏳ | — | — |
| D-16 | İmza: kahve özelleştirici (tarif kartı, canlı fiyat, uyumluluk) | QR-19 · REQ-019 · SCR-003 | M | P0 | ⏳ | — | — |
| D-17 | İmza: saate göre menü (üst çubuk), çekirdek kartları (rakım çizgisi), Keşfet demleme rehberi ve köken | QR-20 · REQ-020 · SCR-001…003 | M | P0 | ⏳ | — | — |
| D-18 | Panel temeli: Better Auth, 2FA, roller ve izinler, mekân seçici, pano iskeleti, ayarlar, ekip, işlem geçmişi | QR-21 · REQ-021 · SCR-100…102, SCR-117…119 | M | P0 | ⏳ | — | — |
| D-19 | Platform yöneticisi: mekân oluştur, alan adı bağla (Vercel API + Deploy Hook), tema ve kip seçimi, kullanıcılar | QR-21 · REQ-021 · SCR-130…132 | M | P0 | ⏳ | — | — |
| D-20 | Panel müsaitlik: tek dokunuş tükendi, günlük adet ±, fırından çıkış, günün menüsü (telefon öncelikli) | QR-08, QR-22 · REQ-008, REQ-022 · SCR-108, SCR-109 | M | P0 | ⏳ | — | — |
| D-21 | `pnpm mekan:yeni` (+ `tema:yeni`) ve `docs/yeni-mekan.md` (Vercel alan adı adımları dahil) | QR-23 · REQ-023 | M | P0 | ⏳ | — | — |
| D-22 | Mekân test matrisi: duman, ekran görüntüsü karşılaştırması (CI temel görüntüleri), Lighthouse, görsel kalite, paket yalıtımı; ortak kod değişince bütün mekânlar | QR-23 · REQ-023 | M | P0 | ⏳ | — | — |

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
| D-38 | Platform tanıtım sayfası: vaka çalışması özeti, mekân vitrinleri, mimari şema | QR-34 · REQ-034 · SCR-050 | M | P1 | ⏳ | — | — |
| D-39 | Deneme mekânı Kepçe, 1 iş günü kabul testi: (a) iki konsept + onay, görsel, içerik (CSV içe aktarma); (b) Sade yapılandırması, matris, inceleme, alan adı, yayın. Adım süreleri `docs/yeni-mekan.md`'ye | QR-35 · REQ-035 | L (2 × M) | P0 | ⏳ | — | — |
| D-40 | Cila: performans ince ayarı, boş durumlar, mikro metinler, hareket | — | M | P1 | ⏳ | — | — |

**Kapsam izlenebilirliği:** Plan §5'teki her P0 / P1 özellik ve §6'daki her P0 ekran aşağıdaki dilimlerden birine bağlıdır. Faz 2 sonunda ve Faz 5 başında denetlenir; dilimsiz satır varsa yeni dilim açılır.

| Plan satırı | Dilim |
|---|---|
| REQ-001 / QR-01 / SCR-051 | D-01 |
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
| SCR-007 Stil (P0) | D-10, D-14 |
| SCR-008 404 (P0) | D-11 |
| SCR-009 Çevrimdışı (P0) | D-13 |
| SCR-010, SCR-011 Baskılar (P0) | D-32 |
| SCR-051 Bilinmeyen alan adı (P0) | D-01 |
| SCR-100…102 Giriş, 2FA, pano (P0) | D-18 |
| SCR-108, SCR-109 Müsaitlik, günün menüsü (P0) | D-20 |
| SCR-117…119 Ayarlar, ekip, geçmiş (P0) | D-18 |
| SCR-130…132 Platform (P0) | D-19 |

## Etkin dilim planı

— (Faz 3 sonrası D-01 ile başlar)

## Görsel inceleme

| Tarih | Dilim / sayfa | GK maddesi | Bulgu | Durum |
|---|---|---|---|---|
| — | — | — | — | — |

## Kalite kapısı raporu

— (Faz 5'te)

## Bilinen sorunlar

- —

## Dersler

- 2026-11-04 · Plan · Brifteki iki varsayım güncel kaynakla çelişti (servis ücreti gösterimi → Ocak 2026'da yasak; Vercel görsel kotası "proje başına" sanılıyordu → hesap başına). Yasal ve kota maddelerinin araştırmada resmî kaynakla doğrulanması plana doğrudan yön verdi. **Sisteme taşı:** sektör modülü `restoran-otel.md` §8'e RG 33153 ve 2026 bileşen / enerji takvimi; 16 §6'ya "Hobby kotaları ekip başınadır" notu.
- 2026-11-04 · Plan · Katalogda çok kiracılı platform ve QR menü için sektör modülü yok; `QR-` önekiyle 37 özellik tanımlandı. **Sisteme taşı:** Faz 8'de `katalog/sektorler/qr-menu-platformu.md` önerisi.
