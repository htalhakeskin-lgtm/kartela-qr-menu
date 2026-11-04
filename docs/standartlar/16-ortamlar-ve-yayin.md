# Ortamlar ve Yayın

> **Durum:** v1.2 · **Son güncelleme:** 2026-10-30
> **Kararlar:** [Bölüm 10](#10-kararlar)

## 1. Bu belge ne işe yarar

Ortamları, ortam değişkenlerini, veritabanı dallarını, yayın akışını, barındırma seçimini ve **demodan canlıya kod değiştirmeden geçişi** tanımlar.

## 2. Ortamlar

| Ortam | Adres | Veritabanı | `DEMO_MODE` | Amaç |
|---|---|---|---|---|
| Yerel | `localhost:3000` | Docker PostgreSQL | `true` | Geliştirme |
| Önizleme | Vercel PR adresi | Neon dalı (PR başına, demo seed'li) | `true` | PR'ı telefonda denemek, müşteriye göstermek |
| Demo | `{proje}.vercel.app` ya da `demo.{alan}` | Neon `main` dalı (demo projesi) | `true` | Portfolyo, satış görüşmesi |
| Canlı | Müşterinin alan adı | Ayrı Neon projesi (müşterinin hesabı tercih edilir) | `false` | Gerçek kullanım |

Demo ile canlı **aynı kodu** çalıştırır; ayrım yalnızca ortam değişkenleri ve veritabanıdır ([02 §5](02-mimari.md#5-demo-ve-canlı-tek-kod)).

## 3. Ortam değişkenleri

Tümü `src/lib/env.ts`'te Zod ile doğrulanır; `.env.example` açıklamalı listedir ([iskelet](../iskelet/.env.example)).

| Değişken | Ne | Demo | Canlı |
|---|---|---|---|
| `DATABASE_URL` | Havuzlu bağlantı (uygulama) | Neon demo | Neon canlı |
| `DATABASE_URL_UNPOOLED` | Doğrudan bağlantı (migration) | ✓ | ✓ |
| `NEXT_PUBLIC_SITE_URL` | Kanonik adres | Demo adresi | Gerçek alan adı |
| `DEMO_MODE` | Demo davranışları | `true` | `false` |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Kimlik doğrulama | ✓ | Yeni değer |
| `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD` | Seed'deki demo yöneticisi | ✓ | Tanımsız |
| `IP_HASH_SALT` | Onay ve log kayıtlarında IP karması | ✓ | Yeni değer |
| `CRON_SECRET` | Zamanlanmış iş uçları | ✓ | Yeni değer |
| `RESEND_API_KEY`, `EMAIL_FROM` | E-posta | İsteğe bağlı (demo kutusu) | Zorunlu |
| `SMS_*`, `WHATSAPP_*` | [Ö] kanallar | Tanımsız | Gerekirse |
| `BLOB_READ_WRITE_TOKEN` | Dosya depolama | ✓ | ✓ |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | [Ö] bot koruması | — | Gerekirse |
| `SENTRY_DSN` | [Ö] hata izleme | — | S3+ |
| `PAYMENT_*` | Ödeme (K4 paketi) | Test anahtarları | Canlı anahtarlar |

Kural: `DEMO_MODE=false` iken canlı için zorunlu değişkenler (`RESEND_API_KEY` gibi) eksikse uygulama açılmaz (koşullu şema).

## 4. Veritabanı ortamları

- Yerel: `docker-compose.yml` ile PostgreSQL (Neon'daki ana sürümle aynı) + gerekli uzantılar (`btree_gist`, `pg_trgm`).
- Neon: demo ve canlı **ayrı projeler**; canlı müşterinin hesabında ya da devredilebilir projede.
- Önizleme: Vercel–Neon entegrasyonuyla her PR'a dal; dal demo verisinden türetilir ve PR kapanınca silinir.
- `db:reset` yalnızca `DEMO_MODE=true` iken çalışır; canlıda reddedilir.
- **Tohum önbelleği temizlemez.** Tohum `site_settings` gibi önbellekli bir kaydı değiştirirse canlı sayfalar önbellek süresi dolana kadar eskiyi gösterir (Levha: ayarlar `cacheLife("hours")`, yeni telefon ancak bir saat sonra göründü). Tohumdan sonra panelden ilgili bölümü bir kez kaydetmek (`updateTag`) ya da yeniden yayın almak yeterlidir; yayın listesinde bu adım yazılıdır.
- Demo veritabanı her gece sıfırlanır [Ö] (cron → `db:reset`), panelde bunun notu vardır.
- **Uyku (soğuk başlangıç):** Neon'un ücretsiz planında işlem birimi boşta kalınca uykuya geçer ve ilk sorgu onu uyandırır. nail-art-studio'da uzun bir boşluktan sonraki ilk ziyarette canlı bölümler 52 sn gecikti. Demo'da bu kabul edilir; sayfa kabuğu yine de beklemeden açılmalıdır ([12 §4](12-performans.md#4-render-ve-veri)). Canlıda ücretli planda uyku kapatılır ya da en düşük işlem boyutu sabitlenir.

## 5. Yayın akışı

```
dal → PR → CI + Vercel önizleme (Neon dalı: migrate + seed) → kendi kendine inceleme → squash → main
main → Vercel üretim yayını: migrate (yayından önce) → build → yayın → duman testi
```

- **Migration zamanlaması:** S1–S3'te Vercel derleme komutu `pnpm db:migrate && next build` (her ortam kendi veritabanına). Migration'lar geriye uyumlu yazıldığı için ([04 §9](04-veri.md#9-migration)) yeni şema eski kodla da çalışır. S4'te migration ayrı CI işinde, yayın elle onaylı (Vercel "promote").
- **Duman testi:** yayından sonra `/api/health`, ana sayfa, bir form sayfası 200 dönmeli (CI zamanlanmış iş ya da uptime izleyicisi).
- **Geri alma:** kod için Vercel'in anında geri alması; veritabanı için geri değil ileri düzeltme (yeni migration). Veri bozulmasında zamana göre geri yükleme ([11 §12](11-guvenlik.md#12-yedek-ve-geri-dönüş)).
- Canlıya yayın iş saatinde, hafta içi; cuma akşamı büyük yayın yok.

## 6. Vercel ve barındırma

| Durum | Barındırma |
|---|---|
| Demo, portfolyo, kişisel proje | Vercel **Hobby** |
| Müşteri sitesi (ticari kullanım) | Vercel **Pro** (müşterinin hesabı ya da ekip) **veya** alternatif |
| Ödeme / yüksek trafik / uzun süren iş | Pro + gerekirse dış kuyruk |
| Müşteri Vercel istemiyor, düşük bütçe | VPS + Docker (`output: "standalone"`, Coolify / Dokploy gibi bir yönetim aracı) ya da Cloudflare / Netlify (uyumluluk denenerek) |
| V0 (PHP) | Paylaşımlı hosting |

**Hobby uyarısı:** Vercel Hobby planı yalnızca kişisel, ticari olmayan kullanım içindir. Müşteriye ait ya da gelir getiren bir site Hobby'de yayınlanmaz; bu, plan §20'de ve teklifte açıkça yazılır (Pro'nun aylık ücreti müşteri maliyetine eklenir).

Hobby'de dikkat edilen sınırlar (güncel değerler araştırma fazında kontrol edilir): görsel dönüştürme kotası (ayda 5.000), cron sıklığı (günde bir), fonksiyon süresi, aylık kullanım kotaları. Kota aşımında site durabilir; demo bu nedenle stok görselleri dış CDN'den sunar ([12 §5](12-performans.md#5-görseller)).

Genel ayarlar: fonksiyon bölgesi `fra1`; Node sürümü `.nvmrc` ile aynı; önizleme koruması (Vercel Authentication) müşteri projelerinde açık, demo projelerinde kapalı.

## 7. Alan adı ve e-posta

- Alan adı müşterinin adına kayıtlı; DNS erişimi müşteride, geliştiriciye yetki verilir.
- `www` → kök (ya da tersi) kalıcı yönlendirme, tek kanonik adres.
- E-posta gönderimi alt alan adından (`bildirim.{alan}`): SPF, DKIM, DMARC kayıtları; Resend'de doğrulama.
- Yanıt adresi işletmenin gerçek e-postası.

## 8. Demodan canlıya geçiş

Kod değişmez; yapılan her şey yapılandırma, içerik ve yasal adımdır. Liste `docs/ilerleme.md`'ye kopyalanır ve işaretlenir:

**Altyapı**
- [ ] Barındırma kararı (Vercel Pro / müşteri hesabı / alternatif) ve hesap devri
- [ ] Canlı Neon projesi (Frankfurt); migration'lar uygulandı; **yalnızca temel seed** (`site_settings`, roller, ilk yönetici); demo verisi yok
- [ ] Veritabanı uykusu kapalı (ücretli plan) ya da soğuk başlangıç süresi ölçüldü ve kabul edildi
- [ ] Ortam değişkenleri canlı değerlerle (yeni gizli anahtarlar; demo anahtarları yeniden kullanılmaz); `DEMO_MODE=false`
- [ ] Alan adı, HTTPS, `www` yönlendirmesi; `NEXT_PUBLIC_SITE_URL`
- [ ] E-posta alan adı doğrulaması; gerçek sağlayıcıyla test gönderimi
- [ ] (Varsa) ödeme sağlayıcısı canlı kip, webhook adresi ve imza anahtarı
- [ ] Yedek, uptime izleme, (S3+) Sentry

**İçerik**
- [ ] Gerçek firma bilgileri panelden girildi (`site_settings`)
- [ ] Kurgusal metinler, görseller, ekip, yorumlar, referanslar gerçekleriyle değişti ya da kaldırıldı
- [ ] Gerçek görseller orijinal dosyalardan; kabul ölçütleri ve görsel inceleme turu yeniden işletildi ([20 §5, §7](20-gorsel-kalite.md#5-görsel-araştırma-ve-seçim))
- [ ] Görsel lisansları kayıtlı; gerçek kişilerin fotoğrafları için izin alındı
- [ ] Demo şeridi ve "örnek" notları kendiliğinden kalktı (DEMO_MODE) — elle kontrol

**Yasal**
- [ ] Yasal metinler firma bilgileriyle dolduruldu ve hukuk danışmanı onayladı
- [ ] Veri işleyen tablosu kesinleşti; yurt dışı aktarım dayanağı ve (standart sözleşmede) 5 iş günü içinde bildirim
- [ ] Saklama süreleri kesinleşti ve zamanlanmış iş açık
- [ ] (Varsa) İYS, ETBİS, mesafeli satış metinleri

**SEO ve ölçüm**
- [ ] `noindex` kalktı, `robots` açık (canlıda başlık testi)
- [ ] Eski siteden 301 eşlemesi
- [ ] Search Console, Bing Webmaster, site haritası gönderimi; Google İşletme Profili bilgileri NAP ile aynı
- [ ] Analitik ve dönüşüm olayları

**Teslim**
- [ ] Kalite kapıları C bölümü canlı ortamda yeniden işletildi
- [ ] Müşteri yöneticisi hesabı (davetle), 2FA (S3+); demo yöneticisi yok
- [ ] Admin kılavuzu teslim edildi, kısa eğitim yapıldı
- [ ] Bakım ve destek kapsamı yazılı (plan §20)

## 9. İzleme ve bakım

**Çerçeve güvenlik duyurusu:** Next.js, Better Auth ya da veritabanı sürücüsü için yüksek / kritik açık duyurulursa yayındaki her proje (demo dahil) aynı gün yama dilimine alınır: sürüm yükseltme → `pnpm check` + e2e → yayın. Demo da herkese açık bir sunucudur.

| İş | Sıklık |
|---|---|
| Uptime izleme (ana sayfa + `/api/health`) | Sürekli, 5 dk |
| Hata izleme | Sürekli (S3+) |
| Bağımlılık güncellemeleri | Haftalık Dependabot PR'ları |
| Yedekten geri yükleme denemesi | Aylık (S3+) |
| Search Console ve Core Web Vitals | İlk ay haftalık, sonra aylık |
| Yasal metin ve saklama süreleri gözden geçirme | Yılda bir ya da mevzuat değişince |

## 10. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| OY-01 | Demo / canlı farkı | Yalnızca ortam değişkeni + veritabanı | Brif: "demo → canlı kod değişmeden". |
| OY-02 | Ticari barındırma | Hobby değil | Vercel Hobby koşulları ticari kullanımı dışlar. |
| OY-03 | Migration zamanı | S1–S3 derleme adımında, S4 ayrı iş | Basitlik ile kontrol dengesi; geriye uyumlu migration şartıyla güvenli. |
| OY-04 | Canlı veritabanı sahipliği | Müşteri hesabı / devredilebilir proje | Teslimden sonra erişim ve faturalama sorunu çıkmaz. |
| OY-05 | Önizleme veritabanı | PR başına Neon dalı | Önizlemede yapılan değişiklik demo verisini bozmaz. |
| OY-06 | Tohum sonrası önbellek | Panelden kaydet ya da yeniden yayın | Tohum etiket güncellemesi yapmaz; Levha'da ayar değişikliği bir saat gecikti (D-055). |

## 11. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | Neon uykusu (soğuk başlangıç); canlıya geçiş listesine veritabanı uykusu ve gerçek görseller maddeleri. |
| 2026-10-30 | v1.2 | Tohumdan sonra önbellek (OY-06, D-055). |
