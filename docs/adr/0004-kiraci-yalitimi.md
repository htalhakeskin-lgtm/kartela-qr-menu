# ADR-0004: Kiracı yalıtımı — kapsamlı sorgu, bileşik anahtar ve satır düzeyi güvenlik

> **Durum:** Önerildi · **Tarih:** 2026-11-04

## Bağlam

Bütün mekânlar tek PostgreSQL veritabanını paylaşır. Brif: "Her sorgu yalnızca kendi mekânının verisini görür. Mekânlar arası veri sızıntısı testlerle kanıtlanır." Sızıntının üç yolu var: (1) `where venue_id = …` unutulan sorgu, (2) başka mekânın kaydına işaret eden ilişki (A mekânının bölümüne B mekânının ürünü), (3) panelde başka mekânın kaydının kimliğiyle yapılan eylem.

## Karar

Üç katmanlı savunma:

| Katman | Ne | Neyi engeller |
|---|---|---|
| 1. Kapsamlı veri erişimi | Kiracı tablolarına yalnızca `withVenue(venueId, (tx) => …)` içinden erişilir. Yardımcı bir işlem açar, `set_config('app.venue_id', $1, true)` çalıştırır ve kapsamlı sorgu oluşturucuyu verir. ESLint, `src/server/db/tenant/**` dışında kiracı tablolarının doğrudan içe aktarılmasını yasaklar | Unutulan filtre (yol 1) |
| 2. Bileşik yabancı anahtar | Her kiracı tablosunda `venue_id`; ilişkiler `(venue_id, id)` çiftine bağlanır (ör. `section_items (venue_id, section_id) → menu_sections (venue_id, id)` ve `(venue_id, item_id) → items (venue_id, id)`) | Mekânlar arası ilişki (yol 2), veritabanı düzeyinde |
| 3. Satır düzeyi güvenlik (RLS) | Kiracı tablolarında `ENABLE` + `FORCE ROW LEVEL SECURITY`; politika `venue_id = current_setting('app.venue_id')::uuid`. Uygulama `app_rw` rolüyle bağlanır (tablo sahibi değil, `BYPASSRLS` yok). Platform yöneticisi ekranları ayrı `platformDb` yardımcısıyla (`app.platform = on` politikası) yalnızca `src/server/platform/**` içinden | Katman 1 atlatılsa bile satır görünmez |
| Eylem yetkisi | `venueAction(permission, …)` sarmalayıcısı: oturum → mekân üyeliği → rol izni → `withVenue`. Başka mekânın kaydı RLS yüzünden bulunamaz → `notFound` (varlığı sızdırmadan) | Yol 3 |

Migration ve tohum tablo sahibi rolüyle çalışır; tohum her mekânı kendi `withVenue` kapsamında yazar.

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
