# Sunucu Eylemleri ve API

> **Durum:** v1.0 · **Son güncelleme:** 2026-10-16
> **Kararlar:** [Bölüm 11](#11-kararlar)

## 1. Bu belge ne işe yarar

Yazma işlemlerinin (sunucu eylemleri), API uçlarının, webhook ve zamanlanmış işlerin nasıl yazılacağını tanımlar. Güvenlik ayrıntısı [11-guvenlik](11-guvenlik.md)'tedir.

## 2. Hangi iş nereye

| İş | Yer |
|---|---|
| Sayfanın verisini okumak | Sunucu bileşeninde `features/<x>/queries.ts` |
| Formdan yazma, panelde değişiklik | Sunucu eylemi: `features/<x>/actions.ts` |
| Dış sistemin bize çağrısı (ödeme, WhatsApp) | `app/api/webhooks/<sağlayıcı>/route.ts` |
| Zamanlanmış iş (hatırlatma, temizlik, senkron) | `app/api/cron/<iş>/route.ts` (Vercel Cron, gizli başlıkla) |
| Dosya indirme (`.ics`, PDF, CSV) | `app/api/<kaynak>/<id>/<biçim>/route.ts` ya da sunucu eylemi + akış |
| Sağlık kontrolü | `app/api/health/route.ts` (veritabanına `select 1`) |
| Mobil uygulama / üçüncü taraf | V2: ayrı API ([02 §8](02-mimari.md#8-ne-zaman-v2-ayrık-api)) |

İstemci bileşeninden `fetch('/api/...')` ile kendi verimizi okumak için API ucu yazılmaz; sunucu bileşeni ya da sunucu eylemi kullanılır.

## 3. Eylem sarmalayıcıları

Her eylem üç sarmalayıcıdan biriyle yazılır ([iskelet/src/server/action.ts](../iskelet/src/server/action.ts)). Sarmalayıcı sırayla: honeypot ve doldurma süresi (yalnızca `publicAction`) → Zod doğrulaması → oturum ve izin → hız sınırı → işleyici → beklenmeyen hatayı yakalama, loglama, destek kodlu genel mesaj.

| Sarmalayıcı | Kim çağırır | Ek denetim |
|---|---|---|
| `publicAction` | Herkes (iletişim formu, randevu talebi, bülten) | Hız sınırı + honeypot zorunlu; Turnstile isteğe bağlı |
| `userAction` | Giriş yapmış üye ([C/D] hesap modeli) | Sahiplik: kayıt `user_id`'si oturumla eşleşmeli |
| `adminAction` | Panel kullanıcısı | Yetki kodu (`appointments.confirm`); değişiklik işlem geçmişine (S3+) |

```ts
// src/features/appointments/actions.ts
"use server";
export const requestAppointment = publicAction({
  schema: appointmentRequestSchema,
  rateLimit: rateLimits.publicForm, // P-01, src/config/limits.ts
  handler: async (input, ctx) => {
    const slot = await findFreeSlot(input);              // farketmez → somut kaynak
    if (!slot) return fail("BR-RND-003");
    const appointment = await createAppointment(slot, input, ctx);
    await send({ channel: "email", to: input.email, template: "appointmentReceived", data: { code: appointment.code } });
    revalidateTag("appointments");
    return ok({ code: appointment.code });
  },
});
```

## 4. Sonuç biçimi

Eylemler istisna fırlatmaz, `Result` döner:

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; fieldErrors?: Record<string, string[]>; errorId?: string };
```

| Durum | `code` | Kullanıcı ne görür |
|---|---|---|
| Doğrulama | `validation` | Alan altında hata; form değerleri korunur |
| İş kuralı | `BR-…` | Kural mesajı (plan §9) |
| Yetkisiz / oturum yok | `unauthorized` / `forbidden` | Giriş ekranına yönlendirme / "Bu işlem için yetkiniz yok." |
| Bulunamadı | `notFound` | "Kayıt bulunamadı ya da silinmiş." |
| Çakışma (sürüm) | `conflict` | "Bu kayıt siz düzenlerken değişti." + yenile seçeneği |
| Hız sınırı | `rateLimited` | "Çok fazla deneme yapıldı. {n} dakika sonra tekrar deneyin." |
| Beklenmeyen | `unexpected` | "Bir sorun oluştu. Destek için kod: {errorId}" |

**Mesaj ilkesi:** Ne olduğunu ve ne yapılacağını söyler, suçlamaz, teknik terim içermez. "Geçersiz giriş" değil, "Telefon numarası 10 haneli olmalı (ör. 0532 123 45 67)."

Hata kimliği (`errorId`) logda ve (S3+) Sentry'de aynı değerle aranabilir.

## 5. Doğrulama

- Şema `schemas.ts`'te; form (React Hook Form resolver) ve eylem **aynı şemayı** kullanır.
- Türkçe hata mesajları şemada yazılır; Zod'un İngilizce varsayılanı kullanıcıya ulaşmaz (`z.config` ile Türkçe yerel ayar ya da her alanda mesaj).
- Metin alanları kırpılır; boş metin `undefined` olur; telefon E.164'e, e-posta küçük harfe, tutar kuruşa **şemada** dönüştürülür.
- Sunucu, istemcinin gönderdiği fiyat, rol, sahip kimliği gibi alanlara güvenmez; bunları kendisi hesaplar ya da oturumdan alır.
- URL parametreleri (`searchParams`, `params`) de şemayla ayrıştırılır; geçersiz değer varsayılana düşer, sayfa çökmez.

## 6. Eşzamanlı düzenleme

- S3+ panelde aynı kaydı iki kişi düzenleyebiliyorsa kayıtta `version` kolonu bulunur.
- Form, açıldığı andaki `version`'ı gizli alanda taşır; güncelleme `WHERE id = $1 AND version = $2` ile yapılır ve `version` bir artırılır.
- Etkilenen satır yoksa `conflict` döner; kullanıcının girdiği değerler kaybolmaz, "Güncel hali yükle" ve "Yine de kaydet" (yalnızca yetkili rol) seçenekleri sunulur.
- Durum geçişleri (randevu onayla, sipariş kargoya ver) `WHERE status = 'beklenen'` koşuluyla yazılır; böylece iki kez onaylama gibi yarışlar kendiliğinden engellenir.

## 7. Tekrar gönderme ve idempotency

| Durum | Önlem |
|---|---|
| Form iki kez gönderildi | Düğme gönderimde devre dışı + eylemde doğal anahtar (aynı e-posta + aynı slot 60 sn içinde tek kayıt) |
| Ödeme / sipariş oluşturma | İstemcide üretilen `idempotency_key` (UUID); tabloda benzersiz |
| Webhook yeniden denendi | Sağlayıcının olay kimliği `webhook_events` tablosunda benzersiz; tekrar gelen olay 200 döner, işlenmez |
| Cron iki kez tetiklendi | İş kendi kaydını işaretler (`reminder_sent_at`); işaretli kayıt atlanır |

## 8. Webhook ve cron uçları

- **İmza doğrulaması zorunlu**; ham gövde üzerinden, sabit zamanlı karşılaştırmayla. İmzasız çağrı 401.
- Uç hızlı yanıt verir (≤ 5 sn); ağır iş kayda alınır, sonra işlenir.
- Olay ham hâliyle `webhook_events` tablosuna yazılır (kişisel veri alanları kırpılarak), sonra işlenir.
- Cron uçları `Authorization: Bearer ${CRON_SECRET}` başlığını denetler. Vercel Hobby'de cron günde birdir; daha sık gereken iş (randevu hatırlatma) "günlük toplu + kayıt anında planlama" ile tasarlanır ya da plan §10'da Pro / dış zamanlayıcı kararı yazılır.

## 9. Dosya yükleme

- Yükleme panelde ya da formda, **sunucudan alınmış imzalı yükleme adresine** doğrudan yapılır; dosya uygulama sunucusundan geçmez.
- Tür (MIME + uzantı + ilk baytlar) ve boyut sunucuda denetlenir; sınırlar `config/limits.ts`'te.
- Görseller yüklemede WebP / AVIF'e dönüştürülür ve en fazla 2560 px'e küçültülür; EXIF (konum dahil) silinir.
- Kişisel belge (sağlık raporu, kimlik) herkese açık depoya konmaz; kısa ömürlü imzalı bağlantıyla sunulur.
- Dosya adı kullanıcıdan alınmaz; anahtar `media/{yıl}/{uuid}.{uzantı}`.

## 10. V2 API kuralları (yalnızca ayrık API seçildiyse)

- Sürüm yolda: `/api/v1/...`; kaynak adları çoğul, İngilizce, kebab-case.
- Hata gövdesi **RFC 9457** (`application/problem+json`): `type`, `title`, `status`, `detail`, `instance`, ek olarak `code` ve `errors`.
- Sayfalama imleçle (`?cursor=…&limit=…`), en fazla 100.
- OpenAPI belgesi koddan üretilir; istemci tipleri ondan türetilir.
- Kimlik: oturum çerezi (aynı alan) ya da kısa ömürlü erişim belirteci + yenileme belirteci (mobil). Uzun ömürlü JWT kullanılmaz.

## 11. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| SA-01 | Yazma yolu | Sunucu eylemi + sarmalayıcı | Revnak ve Bütçe'de kanıtlandı; doğrulama / yetki / hız sınırı unutulamaz. |
| SA-02 | Hata akışı | `Result`, istisna yok | Kullanıcıya her durumda anlamlı mesaj; ERP api.md'deki hata sözleşmesinin eylem karşılığı. |
| SA-03 | Eşzamanlılık | İyimser kilit (S3+) + koşullu durum geçişi | Küçük ekiplerde kilitlemeden daha basit, kayıp güncellemeyi önler. |
| SA-04 | Dış API hata biçimi | RFC 9457 | ERP api.md; standart, istemci kütüphaneleri tanır. |
| SA-05 | Dosya yükleme | Doğrudan depoya, imzalı adresle | Vercel fonksiyonlarının gövde sınırına takılmaz; sunucu yükü yok. |

## 12. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
