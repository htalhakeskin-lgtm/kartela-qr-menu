# Veri ve Veritabanı

> **Durum:** v1.0 · **Son güncelleme:** 2026-10-16
> **Kararlar:** [Bölüm 12](#12-kararlar)

## 1. Bu belge ne işe yarar

PostgreSQL + Drizzle ile şema, tipler, kısıtlar, migration ve seed kurallarını tanımlar. Adlar [03-kod §5](03-kod.md#5-adlar)'tedir.

## 2. İlkeler

1. **Veritabanı son savunma hattıdır.** Ucuz ifade edilebilen her değişmez (benzersizlik, zorunluluk, aralık, çakışmazlık) bir kısıtla da korunur; yarış durumunu uygulama kodu tek başına yakalayamaz.
2. **İş mantığı kodda.** Tetikleyici ve saklı yordamla iş kuralı yazılmaz.
3. **Gerçek olanı reddetme, işaretle.** Gerçekte olmuş bir şeyin kaydı (eksi bakiye, bütçe aşımı, geç ödeme) reddedilmez; görünür biçimde işaretlenir (Bütçe K-16).
4. **Küçük veri, yüksek güvenilirlik.** Mikro optimizasyon yerine doğruluk ve sadelik.

## 3. Drizzle kuralları

- `casing: "snake_case"`: TS alanları camelCase, kolonlar snake_case. Tablo adı her tanımda açıkça çoğul yazılır.
- Şema `src/server/db/schema/` altında özellik başına dosya; ortak kolon yardımcıları `src/server/db/columns.ts` ([iskelet](../iskelet/src/server/db/columns.ts)).
- İlişkiler `relations()` ile; sorgular gereken kolonları seçer.

## 4. Tipler

| Veri | Kolon | Kural |
|---|---|---|
| Kimlik | `uuid` | **UUIDv7**, uygulamada üretilir (`newId()`); kayıttan önce bellidir. Sıralama için kullanılmaz (`created_at` ya da sıra kolonu). |
| İnsanın okuduğu kod | `text` + benzersiz | `RND-2026-0042`, `RVK-2044`: dizi (sequence) + önek; boşluk olabilir, tekrar kullanılmaz. |
| Para | `bigint` (`mode: "number"`) kuruş, ad `…_minor`; çok para birimli projede yanında `currency char(3)` | Kayan nokta yok. Gösterim `formatMoney()`. |
| Oran / yüzde | `numeric(7,4)`, ad `…_percent`, 0–100 | Kesir ile yüzde karışmaz. |
| Ölçü | `integer` ya da `numeric`; birim adda (`area_m2`, `weight_grams`) | — |
| An | `timestamptz`, UTC, ad `…_at` | Gösterim `Europe/Istanbul`. |
| Takvim günü | `date`, ad `…_on` / `…_date` | Doğum tarihi, tatil günü. |
| Günün saati | `time` | Çalışma saatleri. |
| Gelecekteki yerel randevu saati | `timestamptz` (UTC) **ve** yerel duvar saati gerekiyorsa `…_at_local timestamp` + `time_zone` | Saat dilimi kuralı değişirse yerel saat kaybolmaz (ERP V-03). S1–S3 tek saat diliminde yalnızca `timestamptz` yeterli. |
| Telefon | `text`, **E.164** (`+905321234567`) | Gösterim `formatPhone()`. |
| E-posta | `text` + `email_normalized` (küçük harf, kırpılmış) üzerinde benzersiz | — |
| Slug | `text`, benzersiz (kapsam içinde) | `slugify()` (`@/lib/text`) |
| Sabit küme (durum, tür) | `text` + `check` kısıtı | PostgreSQL enum'undan değer silinemez; metin + check serbestçe değişir. Değerler camelCase. |
| Zengin metin | `text` (sunucuda temizlenmiş HTML ya da Markdown) | — |
| Esnek yapı | `jsonb` yalnızca filtrelenmeyen, ilişki kurulmayan veri için (site ayarları, işlem geçmişi farkı, demo kutusu içeriği) | — |
| Arama | `…_search` metin kolonu (Türkçe küçültme + aksan sadeleştirme) + `pg_trgm` GIN indeksi | "isik" yazınca "Işık" bulunur. |

Kullanılmayanlar: `real`, `double precision` (para ve ölçüde), `money`, `char(n)` (para birimi hariç), `serial` (yerine `generated always as identity`).

## 5. Ortak kolonlar

| Tablo türü | Kolonlar |
|---|---|
| Her tablo | `id`, `created_at`, `updated_at` |
| Panelden düzenlenen kök kayıt (S3+) | + `version integer` (iyimser kilit, [05 §6](05-sunucu-ve-api.md#6-eşzamanlı-düzenleme)), `created_by`, `updated_by` |
| İçerik (yazı, ilan, hizmet, yorum) | + `status` (`draft`, `published`, `archived` …), `published_at`, `deleted_at` (çöp kutusu) |
| Ana veri (personel, kategori, şube) | + `archived_at` (silinmez, arşivlenir; eski kayıtlarda görünmeye devam eder) |
| Değişmez kayıt (işlem geçmişi, onay kaydı, ödeme olayı) | Yalnızca ekleme; `updated_at` yok |

## 6. Silme ve KVKK

| Kayıt | Silme | Not |
|---|---|---|
| İçerik | `deleted_at` → 30 gün çöp kutusu → kalıcı silme (zamanlanmış iş) | Panelde geri al |
| Ana veri | Arşiv | Bağlı kayıt varken silinmez (`restrict`) |
| Kişisel veri (talep, randevu, müşteri) | Saklama süresi dolunca **gerçek silme ya da anonimleştirme** | Yumuşak silme KVKK silme yükümlülüğünü karşılamaz. Süreler plan §14'te. |
| Onay kayıtları, işlem geçmişi | Silinmez (yasal ispat); kişisel alanlar en az tutulur | IP düz değil, tuzlu karma |

Varsayılan yabancı anahtar davranışı `restrict`; `cascade` yalnızca bir kaydın kendi alt parçalarında.

## 7. Kısıtlar ve indeksler

- Zorunlu alan `notNull`; boş değer yalnızca "yok" anlamı taşıyorsa.
- Doğal anahtar tekilliği benzersiz indeksle (slug, e-posta, ilan no).
- Aralık kuralları `check` ile (`starts_at < ends_at`, `quantity >= 0`).
- **Zaman çakışması** (randevu, rezervasyon, oda): `btree_gist` + dışlama kısıtı. Aralık yarı açıktır `[başlangıç, bitiş)`; ardışık randevular çakışmaz:

```sql
-- drizzle/custom/0002_appointments_no_overlap.sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE appointments
  ADD CONSTRAINT ex_appointments_staff_overlap
  EXCLUDE USING gist (staff_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status IN ('pending', 'confirmed', 'completed'));
```

  İhlalde PostgreSQL `23P01` döner; eylem bunu kural koduna (`BR-RND-…`, "Bu saat az önce doldu") çevirir. Kaynak seçilmeden ("farketmez") alınan randevu **kaydedilmeden önce** somut bir kaynağa atanır; aksi halde kısıt `NULL` kaynağı korumaz (VetFlow dersi).
- Her yabancı anahtar ve sık filtrelenen kolon indekslidir; filtre + sıralama birlikte kullanılıyorsa bileşik indeks.
- Her kontrol / benzersizlik / dışlama kısıtının adı bir kural koduna eşlenir (`src/server/db/constraint-codes.ts`); eşlemesiz kısıt testte yakalanır (S3+).

## 8. İşlemler ve eşzamanlılık

- Birden fazla tabloyu değiştiren yazma tek veritabanı işlemindedir.
- Dış servis çağrısı işlem açıkken yapılmaz.
- Aynı satırı sık değiştiren sayaçlarda (stok, kalan kontenjan) `SELECT … FOR UPDATE` ya da atomik `UPDATE … SET x = x - 1 WHERE x > 0`.
- Panelden iki kişinin düzenleyebildiği kayıtlarda `version` ile iyimser kilit (S3+).

## 9. Migration

- `pnpm db:generate` (drizzle-kit generate) → üretilen SQL okunur → `pnpm db:migrate`. `drizzle-kit push` yalnızca yerelde, atılacak deneme şemalarında.
- Drizzle'ın modelleyemediği nesneler (dışlama kısıtı, uzantı, `pg_trgm` indeksi) özel SQL migration'ı olarak eklenir ve aynı akışla uygulanır.
- Uygulanmış migration değiştirilmez; hata yeni migration'la düzeltilir.
- Geriye uyumsuz değişiklik (kolon silme / yeniden adlandırma) iki adımda: ekle + birlikte yaz → sonraki sürümde eskiyi kaldır.
- Canlıda migration, uygulama yayınından **önce** çalışır (CI adımı ya da `vercel-build` betiği; [16 §5](16-ortamlar-ve-yayin.md#5-yayın-akışı)).

## 10. Her projede bulunan tablolar

| Tablo | Amaç | Seviye |
|---|---|---|
| `site_settings` | Firma bilgisi, iletişim, saatler, sosyal, tema, özellik anahtarları, SEO varsayılanları (tek satır, `jsonb` bölümler, sürümlü) | Tümü |
| Better Auth tabloları (`users`, `sessions`, `accounts`, `verifications`, `two_factors`, `auth_rate_limits`) | Yönetici (ve hesap modeline göre müşteri) kimliği; `pnpm auth:generate` ile üretilir, elle düzenlenmez (kimlikler `text`, zaman damgaları `timestamptz`e çevrilir) | Tümü |
| `leads` | Form talepleri: tür, kaynak sayfa, UTM, durum, atanan kişi, not | Tümü |
| `consent_records` | Onay kayıtları ([10 §4](10-yasal-ve-kvkk.md#4-onay-kayıtları)) | Tümü |
| `demo_outbox` | Demo'da gönderilmeyen e-posta / SMS / WhatsApp | Tümü |
| `action_rate_limits` | Sunucu eylemi hız sınırı sayaçları (girişin sınırı Better Auth tablosunda) | Tümü |
| `media_assets` | Yüklenen dosyalar: anahtar, tür, boyut, alt metin, kullanım yeri | S2+ |
| `redirects` | 301 yönlendirmeleri (panelden) | S3+ |
| `audit_logs` | Kim, ne zaman, neyi, eski → yeni | S3+ (S2'de çok kullanıcılı panelde) |
| `webhook_events` | Gelen webhook olayları (sağlayıcı olay kimliği benzersiz) | Ödeme / webhook varsa |

## 11. Seed ve sıfırlama

- `scripts/seed.ts`: belirlenimci (sabit rastgele tohum), Türkçe, gerçekçi; hacim seviyeye göre ([17](17-icerik-ve-demo-verisi.md)).
- Tarihler "bugün"e göre göreli üretilir (geçmiş, bugün, gelecek randevular); demo her gün canlı görünür.
- Uç durumlar bilerek eklenir: uzun başlık, görselsiz kayıt, boş kategori, iptal edilmiş randevu, eksi bakiye (varsa).
- `pnpm db:reset` = şemayı sıfırla + migrate + seed. `DEMO_MODE=false` iken çalışmaz.
- Demo yönetici hesabı seed'de oluşur; parolası ortam değişkeninden gelir, depoya yazılmaz.

## 12. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| VR-01 | Kimlik | UUIDv7 | Brif UUID / ULID diyordu; VetFlow cuid kullanmıştı. UUIDv7 PostgreSQL'de yerel tip, indeks dostu, ERP ve Bütçe ile ortak. |
| VR-02 | Para | Kuruş cinsinden `bigint` | Bütçe K-08; brifin isteği. |
| VR-03 | Sabit küme | `text` + `check` | ERP V-06; Drizzle `pgEnum` yerine. |
| VR-04 | Çakışma koruması | Dışlama kısıtı | VetFlow'un ilk tasarımındaki kısmi benzersiz indeks örtüşen aralıkları yakalamıyordu, dışlama kısıtına geçildi; Revnak (K20) çakışmayı yalnızca uygulamada denetliyordu (yarış durumuna açık). |
| VR-05 | Silme | İçerik yumuşak, ana veri arşiv, kişisel veri süre sonunda gerçek silme | Brifin "soft delete" isteği ile KVKK silme yükümlülüğü birlikte karşılanır. |
| VR-06 | Migration | `generate` + SQL inceleme; canlıda `push` yok | Revnak `push` kullanıyordu; geri alınabilir ve incelenebilir migration için. |

## 13. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
