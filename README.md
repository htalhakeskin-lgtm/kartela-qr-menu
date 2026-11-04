# Kartela — çok mekânlı QR menü platformu

Kafe, restoran ve barlar için QR ile açılan, her mekânın kendi alan adında ve kendi temasıyla çalışan dijital menü altyapısı. **Platform:** https://kartela-platform.vercel.app · **Rakım:** https://rakim-kahve.vercel.app (Faz 1 sonunda)

> Gösterim amaçlı demo. Platform, mekânlar, kişiler ve fiyatlar kurgusaldır.

## English summary

Kartela is a multi-tenant QR menu platform built as one Next.js app: each venue opens on its own domain with its own theme, while a shared, headless menu engine handles time-windowed menus, price types, option builders, allergens, translations (incl. RTL) and availability. Tenant isolation is enforced with scoped queries, composite foreign keys and PostgreSQL row level security; each theme lives in its own route tree so no venue ships another venue's code or fonts. Stack: Next.js 16, React 19, TypeScript, Tailwind CSS 4, PostgreSQL (Neon), Drizzle, Better Auth, Vitest, Playwright, Vercel.

## Özellikler

- Alan adına göre mekân: üretimde alan adı, yerelde `{mekan}.localhost`, önizlemede `?mekan=` ya da `/m/{mekan}` ([ADR-0002](docs/adr/0002-kiraci-cozumleme-ve-alan-adi-haritasi.md))
- Tema sözleşmesi: hazır tema (token + yerleşim) ve özel tema (bileşen + imza etkileşimi), tema başına rota ağacı ([ADR-0003](docs/adr/0003-tema-sozlesmesi-ve-rota-alt-agaci.md))
- Menü motoru: saat / gün / mevsim pencereleri, tek · boy · yarım · 100 g · kadeh / şişe fiyatları, ürün kurucu ve uyumluluk kuralları, 14 alerjen, bileşen ve enerji, müsaitlik, eşleşmeler, Keşfet anlatımı
- Kiracı yalıtımı: kapsamlı sorgu + bileşik anahtar + satır düzeyi güvenlik ([ADR-0004](docs/adr/0004-kiraci-yalitimi.md))
- Statik menü, çevrimdışı açılış, mekân başına paket bütçesi ([ADR-0005](docs/adr/0005-statik-menu-istemcide-zaman-ve-baglam.md))
- Yönetim paneli: tek dokunuş müsaitlik, toplu fiyat ve geri alma, QR ve mevzuat baskıları, içe aktarma, çerezsiz istatistik

Planın tamamı: [docs/proje-plani.md](docs/proje-plani.md).

## Teknolojiler

Next.js 16 · React 19 · TypeScript 6 · Tailwind CSS 4 · PostgreSQL 18 (Neon) · Drizzle ORM · Zod 4 · Better Auth · Vitest · Playwright · Lighthouse CI · Docker · Vercel

## Yerel kurulum

Gereksinimler: Node.js 24 (`.nvmrc`), pnpm 12, Docker.

```bash
pnpm install
cp .env.example .env.local      # değerleri doldur (openssl rand …)
docker compose up -d            # yerel PostgreSQL, localhost:5436
pnpm db:migrate && pnpm db:seed
pnpm dev                        # http://localhost:3020
```

Port 3020 ve 5436 bilinçli seçildi (aynı makinedeki başka projelerle çakışmasın, plan K-30).

## Komutlar

| Komut | Ne yapar |
|---|---|
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm check` | Lint, tip, biçim, birim ve entegrasyon testleri |
| `pnpm test:e2e` | Uçtan uca testler |
| `pnpm lighthouse` | Lighthouse CI (derlemeden sonra) |
| `pnpm db:reset` | Veritabanını sıfırlar ve demo verisini yükler |
| `pnpm screenshots` | Ekran görüntüleri |

## Ortam değişkenleri

`.env.example` dosyasında her değişkenin açıklaması vardır. Açılışta `src/lib/env.ts` doğrular; eksik değişkenle uygulama başlamaz.

## Yayın

Vercel'e Git entegrasyonuyla: her PR'a önizleme, `main`'e birleşince üretim; migration'lar derlemeden önce çalışır. Ayrıntı: [docs/standartlar/16-ortamlar-ve-yayin.md](docs/standartlar/16-ortamlar-ve-yayin.md).

## Belgeler

[Proje planı](docs/proje-plani.md) · [İlerleme](docs/ilerleme.md) · [Araştırma](docs/arastirma.md) · [ADR'ler](docs/adr/) · [Kalite kapıları](docs/kalite-kapilari.md)

## Lisans

Portfolyo demosu: Copyright © 2026 Talha Keskin. All rights reserved.
