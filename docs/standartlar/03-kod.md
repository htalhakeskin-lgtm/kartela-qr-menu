# Kod Stili ve İsimlendirme

> **Durum:** v1.0 · **Son güncelleme:** 2026-10-16
> **Kararlar:** [Bölüm 9](#9-kararlar)

## 1. Bu belge ne işe yarar

Kodun biçimini, adlarını ve bunları denetleyen araçları tanımlar. İlke: **biçim tartışılmaz, araç karar verir**; kod incelemesi tasarıma ve iş mantığına odaklanır.

## 2. Dil kuralı

| Ne | Dil |
|---|---|
| Kod adları (değişken, fonksiyon, tip, dosya, tablo, kolon, yetki kodu) | İngilizce, yalnızca ASCII |
| Kod içi yorumlar, commit mesajları, PR başlıkları | İngilizce |
| Kullanıcıya görünen metin | Türkçe |
| Belgeler (`docs/`), PR açıklaması, issue | Türkçe |
| Herkese açık URL segmentleri | Türkçe, ASCII, kebab-case (`/hizmetler/dis-beyazlatma`) |

**Kavram sözlüğü:** S3+ projelerde plan §9'daki varlık tablosu "Türkçe ad → kod adı" eşlemesini de taşır. Yeni kavram koda girmeden önce sözlüğe eklenir; kod adı oradan türetilir.

## 3. TypeScript

`strict` açık; ek olarak `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`. `any` yasak; dış veri `unknown` alınıp Zod ile daraltılır. `enum` yerine `as const` nesne + birleşim tipi. Yol takma adı: `@/*` → `src/*`.

## 4. Biçim ve lint

- **Prettier:** varsayılan ayarlar, `printWidth: 100`, `prettier-plugin-tailwindcss`. Markdown dosyaları Prettier dışında (tablo hizalaması farkları şişirir).
- **ESLint (flat config):** `eslint-config-next` (core-web-vitals + typescript), typescript-eslint (`strictTypeChecked`), `jsx-a11y`, `simple-import-sort`, modül sınırı kuralı, kural kapatma yorumlarını denetleyen eklenti. Next.js 16'da `next lint` olmadığı için `eslint .` doğrudan çalışır.

**Projeye özgü yasaklar** (iskelet: [iskelet/eslint.config.mjs](../iskelet/eslint.config.mjs)):

| Yasak | Yerine | Neden |
|---|---|---|
| `parseFloat` (lint); tutarda `Number()` (inceleme) | `parseMoney()` (`@/lib/money`) | Kayan nokta hatası; Türkçe ondalık virgül |
| Argümansız `toLocaleLowerCase()`, `toLocaleUpperCase()`, `localeCompare(x)` | `"tr-TR"` argümanıyla ya da `compareTurkish()` (`@/lib/text`) | Tarayıcının diline göre değişen sonuç (İ / ı) |
| `dangerouslySetInnerHTML` | `<SafeHtml>` (sunucuda temizlenmiş içerik) | XSS |
| `process.env` doğrudan | `env` (`@/lib/env`, sunucu) / `publicEnv` (`@/lib/public-env`) | Doğrulanmamış yapılandırma |
| `console.log` | `logger` | Geliştirme artığı; kişisel veri sızıntısı |
| `domain/` içinde `new Date()`, `Date.now()` | `now` parametresi | Test edilebilirlik |
| `==` | `===` | Tip dönüştürme sürprizleri |
| Gerekçesiz `eslint-disable` | `// eslint-disable-next-line kural -- gerekçe` | Sapmanın nedeni kayıtta kalır |

## 5. Adlar

| Öğe | Biçim | Örnek |
|---|---|---|
| Dosya, klasör | kebab-case | `appointment-form.tsx` |
| Bileşen, tip | PascalCase | `AppointmentForm`, `AppointmentFormValues` |
| Değişken, fonksiyon | camelCase | `availableSlots`, `formatMoney()` |
| Değişmez ilkel sabit | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_BYTES` |
| Boolean | `is` / `has` / `can` / `should` + ad | `isPublished` |
| Olay özelliği / işleyici | `onX` / `handleX` | `onSubmit` / `handleSubmit` |
| Zod şeması / form tipi | `xSchema` / `XFormValues` | `appointmentSchema` |
| Sunucu eylemi | fiil + nesne | `createAppointment`, `archiveService` |
| Sorgu | `getX` (tek), `listX` (çok) | `getService`, `listServices` |
| Tablo | snake_case, **çoğul** | `appointments`, `consent_records` |
| Kolon | snake_case; an `_at`, gün `_on` / `_date`, tutar `_minor` | `starts_at`, `price_minor` |
| Kısıt / indeks | `pk_`, `fk_`, `ux_`, `ix_`, `ck_`, `ex_` önekli | `ex_appointments_staff_overlap` |
| Hata kodu | Kural numarası ya da camelCase teknik kod | `BR-RND-003`, `rateLimited` |
| Yetki kodu | `kaynak.eylem` (eylem sözlüğü: `view`, `create`, `edit`, `archive` + alana özgü fiil) | `appointments.confirm` |
| Önbellek etiketi | `kaynak` / `kaynak:id` | `services:abc` |
| Ortam değişkeni | SCREAMING_SNAKE_CASE; istemciye açılan `NEXT_PUBLIC_` | `RESEND_API_KEY` |
| Test adı | Kural numarasıyla başlar | `BR-RND-003: rejects overlap…` |

**Kısaltma yasağı:** `qty`, `amt`, `desc`, `btn`, `msg` yazılmaz. İzinliler: `id`, `url`, `api`, `ui`, `db`, `seo`, `pdf`, `ics`, `utc`. Kısaltmalar kelime gibi yazılır: `SeoHead`, `PdfLink`.

## 6. Dışa aktarım ve bileşen

- Adlı dışa aktarım. Varsayılan dışa aktarım yalnızca Next.js'in zorunlu kıldığı dosyalarda (`page`, `layout`, `route`, `error`, `not-found`, `sitemap`, `robots`, `opengraph-image`, yapılandırma dosyaları).
- Bileşen özellikleri `XProps` tipiyle; `React.FC` yok.
- Sunucu verisi istemcide `useEffect` ile çekilmez.
- Liste filtreleri, sıralama ve sayfa numarası URL'de tutulur (paylaşılabilir, geri tuşu çalışır).

## 7. Yorum, hata ve log

- Yorum **neden**i anlatır. Yorum satırına alınmış kod depoya girmez. `TODO` yalnızca numarayla: `// TODO(#12): …`.
- Kural uygulayan kodun yanında kural numarası: `// BR-RND-003`. Böylece "bu kural nerede?" aramayla bulunur.
- Eylemler istisna fırlatmaz, `Result` döner; beklenmeyen hata yakalanır, loglanır, kullanıcıya genel mesaj + hata kimliği gösterilir.
- Log yapılandırılmıştır (JSON); kişisel veri (ad, e-posta, telefon, mesaj metni) yazılmaz, yalnızca kimlik.

## 8. Türkçe metin işleme

| İş | Doğru |
|---|---|
| Arama için küçültme | `toSearchKey()` (`@/lib/text`): `tr-TR` küçültme + aksan sadeleştirme |
| Teknik anahtar küçültme | `key.toLowerCase()` |
| Sıralama | `compareTurkish()` (`@/lib/text`, `Intl.Collator("tr")`) |
| Sayı / para / tarih / telefon gösterimi | `@/lib/format` |
| Telefon girişi → E.164 | `toE164TR()` (`@/lib/phone`) |
| Slug | `slugify()` (`@/lib/text`; ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u) |

## 9. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| KD-01 | Biçimlendirici | Prettier; ESLint biçim kuralı içermez | Araçlar çakışmaz. |
| KD-02 | Dil | Kod İngilizce, arayüz ve belge Türkçe | Brif + ERP standardı; portfolyoyu yabancı okuyucu da inceler. |
| KD-03 | Tablo adı | Çoğul snake_case | `user`, `order` gibi ayrılmış kelimelerle çakışmaz. |
| KD-04 | Sorgu adları | `get` / `list` | Tek harf farkıyla karışan adlar (`getEvent` / `getEvents`) önlenir. |
| KD-05 | Kural izi | Kodda ve test adında kural numarası | Bütçe'deki izlenebilirlik yaklaşımı. |

## 10. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
