# ADR-0001: Tek Next.js uygulaması, alan adına göre çok kiracılı yapı

> **Durum:** Önerildi (plan onayıyla kabul edilir) · **Tarih:** 2026-11-04

## Bağlam

Kartela, her biri kendi alan adında ve kendi temasıyla bağımsız bir site gibi görünen QR menü mekânlarını tek kod tabanından sunacak. Asıl çıktı altyapıdır: yeni mekân hazır temayla 1 iş gününde, özel temayla birkaç günde eklenmelidir. Barındırma Vercel (demo için Hobby). İki topoloji karşılaştırıldı:

- **A — Tek uygulama, tek Vercel projesi:** `proxy.ts` gelen alan adından mekânı bulur, isteği içeride mekânın tema alt ağacına yeniden yazar.
- **B — Monorepo + mekân başına ayrı Vercel projesi:** ortak paketler (`packages/menu-core`, `packages/ui`), her mekân ayrı Next.js uygulaması.

## Karar

**A seçildi.** Tek Next.js 16 uygulaması, tek Vercel projesi. Mekân, alan adına göre çözülür ([ADR-0002](0002-kiraci-cozumleme-ve-alan-adi-haritasi.md)); her tema kendi rota alt ağacında ve kendi kök düzeninde yaşar, böylece tasarım özgürlüğü ve paket yalıtımı korunur ([ADR-0003](0003-tema-sozlesmesi-ve-rota-alt-agaci.md)). Veri tek PostgreSQL veritabanında, mekâna göre yalıtılmış ([ADR-0004](0004-kiraci-yalitimi.md)).

**Not:** Brifteki iç yol `/_m/[mekan]` App Router'da kullanılamaz: alt çizgiyle başlayan klasör "özel klasör"dür ve rotalamadan çıkarılır. İç yol `/tema-{tema}/{mekan}/{dil}/…` olur; bu yollar dışarıdan istenirse 404 döner (BR-KRC-004).

## Karşılaştırma

| Ölçüt | A — Tek uygulama | B — Monorepo + mekân başına proje | Kazanan |
|---|---|---|---|
| Yeni mekân ekleme maliyeti | İçerik klasörü + (gerekirse) tema klasörü + alan adı kaydı; tek PR. Yeni proje, ortam değişkeni, veritabanı, CI işi yok. `pnpm mekan:yeni` hepsini üretir | Yeni uygulama paketi + Vercel projesi + ortam değişkenleri kopyası + alan adı + CI matrisi + Neon bağlantısı; mekân başına ~1–2 saat ek kurulum ve her sır döndürmede N proje | A |
| Tasarım özgürlüğü | Tema = rota alt ağacı + kendi kök düzeni (`<html>`, yazı tipleri, CSS, hareket). Ortak olan: Next.js sürümü, CSP, güvenlik başlıkları, `next.config.ts`. Bileşen ve yerleşim düzeyinde sınırsız | Tam: farklı Next.js ayarı, farklı kütüphane, hatta farklı çatı | B (A'nın sınırı pratikte yalnızca yapılandırma düzeyinde) |
| Bir mekândaki hatanın diğerlerini etkilemesi | Ortak çekirdekteki hata hepsini etkiler; tema hatası yalnızca o temanın rotalarını (`error.tsx` alt ağaçta). Derleme hatası herkesin yayınını durdurur → önlem: mekân test matrisi (duman + ekran görüntüsü karşılaştırması + Lighthouse) her PR'da bütün mekânlarda | Yayınlar yalıtık. Ama ortak paketteki hata her projeye ayrı ayrı yayılır; yamalamak N yayın ister | B (yalıtım), A (düzeltme hızı) |
| Yayın sayısı | Commit başına 1 yayın. Hobby: günde 100 yayın, saatte sınırlı derleme | Commit başına N yayın ("ignored build step" ile azaltılabilir). 10 mekânda günde 10 commit = 100 yayın, Hobby sınırı dolar | A |
| Vercel Hobby alan adı sınırı | Proje başına 50 alan adı ([Limits](https://vercel.com/docs/limits)). Mekân başına kök + `www` = 2 → ~24 mekân + platform. Pro'da sınırsız (yumuşak 100.000) | Her projede 50; sorun değil. Ama Hobby'de Git deposu başına en fazla 25 proje | A demo ölçeğinde yeterli; büyüyünce Pro |
| Görsel dönüştürme kotası | Ayda 5.000 dönüşüm. **Kota proje değil ekip (hesap) başınadır** ("Hobby teams get a monthly allotment"); bütün mekânlar paylaşır | **Aynı kota paylaşılır**: ayrı proje kotayı artırmaz. Brifteki "tek projede paylaşılır" varsayımı B için de geçerli | Eşit. İkisinde de çözüm: stok görsel kaynağın CDN'inden (özel loader), yüklenen görsel yüklemede boyutlandırılır → Vercel kotası kullanılmaz |
| Ticari kullanım | Hobby yalnızca ticari olmayan kişisel kullanım; gerçek mekân → Pro (tek proje, tek ücret) | Pro'da ücret üye başına, proje sayısından bağımsız; ama yönetim yükü N kat | A |
| Paket bütçesi ölçümü | Mekân başına: mekânın ana rotasının HTML'indeki parçalar (`pnpm olcum:js --mekan`). Tema alt ağacı sayesinde başka tema pakete girmez | Doğal olarak mekân başına | Eşit (A'da ADR-0003 koşuluyla) |

## Sonuçlar

- **Olumlu:** Yeni mekânın marjinal maliyeti içerik + tema; altyapı düzeltmesi tek yayında bütün mekânlara ulaşır; tek veritabanı, tek panel, tek oturum alanı; portfolyo anlatısı ("tek altyapı, N farklı deneyim") kodla birebir örtüşür.
- **Olumsuz / ödünler:** Ortak çekirdekteki hata bütün mekânları etkiler → mekân test matrisi zorunlu (her PR'da, ortak kod değiştiyse bütün mekânlar). Bütün mekânlar aynı Next.js sürümü ve CSP ile yaşar. Alan adı eklemek derleme anı haritası yüzünden yeniden yayın ister ([ADR-0002](0002-kiraci-cozumleme-ve-alan-adi-haritasi.md)).
- **Yeniden değerlendirme koşulu:** (1) Bir mekân çatı düzeyinde farklılık isterse (başka Next.js ayarı, ayrı CSP), o mekân B modeline taşınır; tema sözleşmesi ve çekirdek paketlenebilir olduğu için geçiş mümkün kalır. (2) Hobby'de 24 mekânı aşınca Pro'ya geçilir. (3) Ticari ilk müşteride Pro zorunlu.

## Değerlendirilen alternatifler

| Seçenek | Neden seçilmedi |
|---|---|
| B — Monorepo + mekân başına Vercel projesi | Yeni mekân maliyeti ve yayın sayısı yüksek; görsel kotası zaten hesap başına olduğu için B'nin sanılan kota avantajı yok; tek geliştirici için N projenin sır, ortam ve alan adı yönetimi ağır |
| Alt alan adlı tek site (`rakim.kartela.app`) | Brif her mekânın kendi alan adını istiyor; mekânlar birbirine bağlı görünmemeli. Alt alan adı yalnızca yerel geliştirmede (`rakim.localhost`) |
| Yol önekli tek site (`kartela.app/rakim`) | Bağımsız site görünümü yok; canonical ve PWA kapsamı mekâna ait değil. Yalnızca önizleme ortamında kullanılır |

## Kaynaklar

- Vercel Limits — https://vercel.com/docs/limits (2026-09-16 güncellemesi; erişim 2026-11-04)
- Vercel Image Optimization Limits and Pricing — https://vercel.com/docs/image-optimization/limits-and-pricing (2026-08-11)
- Next.js App Router, özel klasörler (`_folder`) — `node_modules/next/dist/docs/` (Faz 3'te kurulu sürümle doğrulanır)
