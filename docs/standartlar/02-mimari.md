# Mimari ve Klasör Yapısı

> **Durum:** v1.0 · **Son güncelleme:** 2026-10-16
> **Kararlar:** [Bölüm 9](#9-kararlar)

## 1. Bu belge ne işe yarar

Her V1 projesinin aynı iskeletle kurulmasını sağlar: klasörler, katmanlar, yapılandırma düzeyleri, demo / canlı ayrımı ve render stratejisi.

## 2. Klasör yapısı

```
.
├── src/
│   ├── app/
│   │   ├── (site)/                 herkese açık sayfalar; URL segmentleri Türkçe ASCII (/hizmetler, /iletisim)
│   │   ├── (hesap)/hesabim/        [C/D] üye alanı
│   │   ├── panel/                  yönetim paneli (noindex)
│   │   ├── api/                    yalnızca: auth, cron, webhook, health, dosya / .ics indirme
│   │   ├── layout.tsx  globals.css (Tailwind + token'lar)  not-found.tsx  error.tsx  global-error.tsx
│   │   ├── sitemap.ts  robots.ts  manifest.ts  opengraph-image.tsx
│   ├── features/<feature>/         özellik modülü (İngilizce ad: listings, appointments, leads)
│   │   ├── actions.ts              yazma (sunucu eylemleri, sarmalayıcıyla)
│   │   ├── queries.ts              okuma (server-only)
│   │   ├── schemas.ts              Zod şemaları (istemci + sunucu ortak)
│   │   ├── domain/                 saf iş kuralları ve hesaplamalar (birim testi hedefi)
│   │   ├── components/             özelliğe ait bileşenler
│   │   └── index.ts                dışa açık yüzey
│   ├── components/
│   │   ├── ui/                     shadcn/ui kopyaları
│   │   ├── common/                 uygulama ortak bileşenleri (EmptyState, MoneyText, StatusBadge…)
│   │   ├── layout/                 DemoBanner, Header, Footer, MobileActionBar, PanelShell, PanelTabBar
│   │   └── sections/               ana sayfa bölümleri
│   ├── server/
│   │   ├── db/ (client.ts, schema/, columns.ts)
│   │   ├── auth.config.ts  auth.ts Better Auth: CLI'nin okuyabildiği seçenekler + sırlar ve veritabanı
│   │   ├── action.ts               eylem sarmalayıcıları
│   │   ├── channels/               e-posta, SMS, WhatsApp, demo kutusu (index.ts, templates.ts)
│   │   ├── rate-limit.ts  request.ts  logger.ts  (+ audit.ts  consent.ts  storage.ts  settings.ts)
│   ├── lib/                        env.ts, public-env.ts, format.ts, money.ts, phone.ts, text.ts, result.ts, seo.ts
│   ├── config/                     site-defaults.ts, limits.ts (P- numaralı parametreler), permissions.ts, rules.ts (BR → mesaj)
│   └── proxy.ts                    panel oturum denetimi + nonce'lu CSP (Next.js 16'da middleware yerine)
├── content/                        yasal metinler (md), statik içerik
├── drizzle/                        migration'lar (üretilir, elle düzenlenmez; özel SQL ayrı dosyada)
├── scripts/                        seed.ts, reset.ts, auth-schema-tz.mjs, git/protect-main.sh
├── tests/e2e/                      Playwright
├── portfolyo/                      screenshot/, mockup/, araclar/, portfolyo.md
├── docs/                           proje-plani.md, arastirma.md, ilerleme.md, kalite-kapilari.md, standartlar/, adr/
└── docker-compose.yml  .env.example  AGENTS.md  CLAUDE.md
```

## 3. Katman kuralları

| Katman | Kural |
|---|---|
| Sayfa (`app/`) | Veriyi sunucu bileşeninde `queries` ile okur; doğrudan veritabanına erişmez. İş mantığı yazmaz. |
| Sorgu | `import "server-only"`; yalnızca gereken kolonları seçer; görünür satırları filtreler (yayında / silinmemiş). |
| Eylem | `publicAction` / `userAction` / `adminAction` sarmalayıcısıyla ([05](05-sunucu-ve-api.md)). İstisna fırlatmaz, `Result` döner. |
| Alan (`domain/`) | Saf fonksiyon; veri ve "şimdi" parametre olarak gelir. Veritabanı, `fetch`, `Date.now()` yok. |
| Kanallar | Dış iletişim yalnızca `server/channels` üzerinden (demo / canlı ayrımı burada). |
| Modül sınırı | Bir özellik başka bir özelliğin yalnızca `index.ts`'inden içe aktarır (ESLint ile denetlenir). |
| İstemci bileşeni | `"use client"` ağacın en küçük yaprağına konur; sayfa bütünü istemci bileşeni olmaz. |

## 4. Yapılandırma düzeyleri

| Düzey | Nerede | Ne | Kim değiştirir |
|---|---|---|---|
| Ortam | `.env*` → `src/lib/env.ts` (Zod, açılışta doğrulama) | Gizli anahtarlar, adresler, `DEMO_MODE` | Geliştirici / Vercel |
| İş parametreleri | `src/config/limits.ts` (her satır BR / P numarasıyla) | Tampon süreleri, dosya boyutu, hız sınırları | Geliştirici (PR) |
| Site ayarları | `site_settings` tablosu (tek satır, sürümlü), varsayılanı `src/config/site-defaults.ts` | Firma adı, iletişim, çalışma saatleri, sosyal medya, tema, özellik anahtarları, SEO varsayılanları | Yönetici (panel) |

Site ayarları VetFlow'daki `SiteSetting` yaklaşımıdır: firma bilgisi kodda gömülü değildir; aynı kod başka bir işletmeye yalnızca ayarlarla uyarlanır (white-label). Herkese açık alt küme önbelleğe alınır ve ayar değişince etiketle yenilenir.

## 5. Demo ve canlı: tek kod

**İlke:** Demo ayrı bir veri katmanı değildir. Demo, **gerçek veritabanı + seed verisi + `DEMO_MODE=true`** demektir. Böylece canlıya geçişte veri erişim kodu değişmez (Revnak'ta statik `src/data` katmanı sonradan veritabanına bağlanmak zorunda kalmıştı; bu standart o adımı ortadan kaldırır).

| `DEMO_MODE=true` iken | `false` iken |
|---|---|
| `robots` tümünü engeller, sayfalarda `noindex` | Normal indeksleme |
| Üstte "Gösterim amaçlı demo" şeridi, alt bilgide not | Şerit yok |
| E-posta / SMS / WhatsApp API gönderilmez; `demo_outbox` tablosuna yazılır, panelde "Demo kutusu" ekranında görünür | Gerçek sağlayıcı |
| Ödeme sağlayıcısı test kipinde | Canlı kip (ayrıca yapılandırılır) |
| Harici veri senkronu (Google yorumları vb.) seed verisini kullanır | Gerçek API |
| `db:reset` izinli | `db:reset` reddedilir |
| Panelde örnek giriş bilgisi giriş ekranında gösterilir (yalnızca demo hesabı) | Gösterilmez |

Kanal soyutlaması:

```ts
// src/server/channels/index.ts (özet)
export type OutboundMessage = { channel: "email" | "sms" | "whatsapp"; to: string; template: string; data: Record<string, unknown> };
export async function send(message: OutboundMessage): Promise<void> {
  if (env.DEMO_MODE) return demoOutbox.write(message);   // her zaman çalışır, maliyetsiz
  return providers[message.channel].send(message);       // Resend, Netgsm, WhatsApp Cloud API…
}
```

## 6. Render ve önbellek

| Sayfa türü | Strateji |
|---|---|
| Vitrin (ana sayfa, hizmetler, blog, ilan detayı) | Statik / önbellekli; içerik değişince `revalidateTag`. Cache Components açıksa statik kabuk + akışla gelen dinamik parçalar. |
| Filtreli liste | Kabuk statik, sonuçlar `searchParams`'a göre dinamik (Suspense ile akış). |
| Form gönderimi, panel, hesap | Dinamik; kişisel veri önbelleğe alınmaz. |

Önbellek etiketi biçimi: `{kaynak}` ve `{kaynak}:{id}` (ör. `services`, `services:abc`). Yazan eylem ilgili etiketleri yeniler.

## 7. Tema ve white-label

- Renkler, yazı, yarıçap ve gölge yalnızca token'lardan gelir ([06 §3](06-arayuz.md#3-tasarım-tokenları)).
- Tema presetleri `<html data-theme="…">` ile değişir; seçili preset `site_settings`'te tutulur ve tüm ziyaretçilere uygulanır (VetFlow).
- Her preset tek hâkim renk + nötrler disiplinine uyar; her preset için kontrast testi çalışır.

## 8. Ne zaman V2 (ayrık API)

Aynı veriyi bir mobil uygulama ya da üçüncü taraf kullanacaksa: ayrı API (Hono ya da NestJS), `/api/v1`, RFC 9457 hata biçimi, OpenAPI belgesi ve ondan üretilen istemci. Ön yüz yine Next.js'tir. Karar ADR ile alınır.

## 9. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| MM-01 | Yapı | Özellik bazlı modüller | Brifin isteği; Bütçe'de kanıtlandı. |
| MM-02 | Demo verisi | Gerçek veritabanı + seed; mock katmanı yok | Demo → canlı geçişte kod değişmez. |
| MM-03 | Firma bilgisi | `site_settings` tablosunda | Panelden değişir; white-label. |
| MM-04 | URL dili | Herkese açık ve panel URL'leri Türkçe ASCII; kod adları İngilizce | SEO ve kullanıcı için Türkçe adres; kod tutarlılığı için İngilizce ad. |
| MM-05 | Dış iletişim | Tek kanal soyutlaması | Demo'da maliyet ve hata riski sıfır (VetFlow). |

## 10. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
