# ADR-0004: Kiracı yalıtımı — kapsamlı sorgu, bileşik anahtar ve satır düzeyi güvenlik

> **Durum:** Kabul edildi · **Tarih:** 2026-11-04 · D-02'de uygulandı (bağlantı biçimi plan K-41)

## Bağlam

Bütün mekânlar tek PostgreSQL veritabanını paylaşır. Brif: "Her sorgu yalnızca kendi mekânının verisini görür. Mekânlar arası veri sızıntısı testlerle kanıtlanır." Sızıntının üç yolu var: (1) `where venue_id = …` unutulan sorgu, (2) başka mekânın kaydına işaret eden ilişki (A mekânının bölümüne B mekânının ürünü), (3) panelde başka mekânın kaydının kimliğiyle yapılan eylem.

## Karar

Üç katmanlı savunma:

| Katman | Ne | Neyi engeller |
|---|---|---|
| 1. Kapsamlı veri erişimi | Kiracı tablolarına yalnızca `withVenue(venueId, (tx) => …)` içinden erişilir. Yardımcı bir işlem açar, tek sorguda `set_config('role', 'app_rw', true)` ve `set_config('app.venue_id', $1, true)` çalıştırır ve kapsamlı sorgu oluşturucuyu verir. Kiracı tabloları `src/server/db/tenant/tables/`'tadır ve uygulamanın paylaşılan şemasına (`@/server/db/schema`) girmez; ESLint, `src/server/db/tenant/**`, `scripts/` ve `tests/` dışında bu klasörün içe aktarılmasını yasaklar | Unutulan filtre (yol 1) |
| 2. Bileşik yabancı anahtar | Her kiracı tablosunda `venue_id`; ilişkiler `(venue_id, id)` çiftine bağlanır (ör. `section_items (venue_id, section_id) → menu_sections (venue_id, id)` ve `(venue_id, item_id) → items (venue_id, id)`) | Mekânlar arası ilişki (yol 2), veritabanı düzeyinde |
| 3. Satır düzeyi güvenlik (RLS) | Kiracı tablolarında `ENABLE` + `FORCE ROW LEVEL SECURITY`; politika `venue_id = nullif(current_setting('app.venue_id', true), '')::uuid or current_setting('app.platform', true) = 'on'` (USING ve WITH CHECK). Kiracı sorguları `app_rw` rolüyle çalışır (giriş yapamaz, tablo sahibi değil, `BYPASSRLS` yok); uygulama sahip rolle bağlanır ve rolü işlem içinde değiştirir (K-41). Platform kapsamı `withPlatform` (`app.platform = on`) yalnızca `src/server/platform/**`, `src/server/db/tenant/**`, `scripts/` ve `tests/` içinden | Katman 1 atlatılsa bile satır görünmez |
| Eylem yetkisi | `venueAction(permission, …)` sarmalayıcısı: oturum → mekân üyeliği → rol izni → `withVenue`. Başka mekânın kaydı RLS yüzünden bulunamaz → `notFound` (varlığı sızdırmadan) | Yol 3 |

Migration ve tohum tablo sahibi rolüyle çalışır; tohum her mekânı kendi `withVenue` kapsamında yazar (`seedVenues`).

**Kiracı kökü:** `venues` tablosunun `venue_id` kolonu yoktur, RLS'si yoktur; `app_rw` yalnızca okur (statik sayfalar mekân kapsamı kurulmadan önce slug'dan kimliğe gider). Mekânı oluşturan ve değiştiren platformdur (tohum, D-19). Denetim kaydı ve demo kutusu (`audit_logs`, `demo_outbox`) kiracı tablosudur; `venue_id`'si boş platform satırları yalnızca platform kapsamında görünür.

**Rol geçişi neden bağlantı rolü değil (K-41):** `app_rw`'yi parolalı bir giriş rolü yapmak ikinci bir bağlantı dizesi ve gizli bilgi ister; Neon'un Vercel entegrasyonu `DATABASE_URL`'i kendisi yönetir ve önizleme dalları bu ikinci diziyi taşımaz. `set_config('role', …, true)` işlem bitince sıfırlanır, havuzlu bağlantıda güvenlidir ve sahip rolün RLS'yi aşıp aşmamasından bağımsızdır. Bedeli: kiracı tablosuna `withVenue` dışından, sahip rolle erişen kod RLS'ye takılmayabilir (sahip `BYPASSRLS` ise); bunu ESLint kuralı (katman 1) ve kiracı tablolarının paylaşılan şemada olmaması engeller.

**Önbellek etiketleri mekân öneklidir:** `menu:{mekan}`, `venue:{mekan}`, `stories:{mekan}`, `stats:{mekan}`. Bir mekânın güncellemesi başka mekânın önbelleğini yenilemez; `"use cache"` fonksiyonları `venueId`'yi argüman olarak alır (önbellek anahtarına girer).

**Kanıt (kiracı yalıtımı test takımı, `tests/integration/tenant/`):**
- İki mekân kurulur (A, B). Her kiracı tablosu için A kapsamında B'nin satırları okunamaz, güncellenemez, silinemez (RLS testi, tablo listesi şemadan otomatik çıkarılır; yeni tablo eklenince test kendiliğinden kapsar).
- Mekânlar arası ilişki denemesi veritabanı hatası verir (bileşik FK) ve eylem `BR-KRC-002` koduyla döner.
- Her panel eylemi için "başka mekânın kaydı" testi (`notFound`) ve "üye olmayan kullanıcı" testi (`forbidden`).
- Önbellek: A'nın güncellemesi B'nin `menu:` etiketini yenilemez.
- Tablo listesi denetimi: `venue_id` taşıyıp RLS'si kapalı tablo varsa test düşer.

## Sonuçlar

- **Olumlu:** Sızıntı tek bir hatayla oluşamaz; kanıt otomatik ve yeni tablolara kendiliğinden yayılır; denetimde gösterilebilir bir güvenlik hikâyesi.
- **Olumsuz / ödünler:** Her kiracı okuması bir işlem içinde (`set_config` + sorgu): statik üretimde ve panelde ek ~1 gidiş-dönüş; havuzlu bağlantıda `set_config(..., true)` (işlem kapsamlı) zorunlu, oturum kapsamlı ayar yasak. Neon'da iki veritabanı rolü yönetilir.
- **Yeniden değerlendirme koşulu:** Mekân sayısı yüzlerle ölçülür ya da bir mekân veri yerleşimi (ayrı veritabanı) şart koşarsa şema başına ya da veritabanı başına kiracıya geçiş ADR'si.

## Değerlendirilen alternatifler

| Seçenek | Neden seçilmedi |
|---|---|
| Yalnızca uygulama düzeyinde filtre | Tek unutulan `where` sızıntıdır; brif kanıt istiyor |
| Mekân başına şema / veritabanı | Neon ücretsiz katmanda yönetim yükü, migration'ın N kez çalışması; bu ölçekte gereksiz |
| Yalnızca RLS | Bileşik FK olmadan mekânlar arası ilişki RLS'ye takılmadan kurulabilir (sahip rolü tohumu); katmanlar birbirini tamamlar |
