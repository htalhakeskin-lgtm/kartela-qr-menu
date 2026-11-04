# ADR-0006: Menü sayfalarında Lighthouse eşiği ve sert hız kapısı

> **Durum:** Kabul edildi · **Tarih:** 2026-11-04 · Kullanıcı kararı K-27'nin uygulanması (plan K-40)

## Bağlam

Brifin hız hedefleri: menü sayfalarında Lighthouse mobil performans ≥ 95 ve QR'dan sonra ilk ürünün 4G'de en geç 1,5 sn'de görünmesi. Plan K-17 bunu menü sayfalarında 0,95 **hata** eşiği yaptı. Kullanıcı K-27'de yolu önceden belirledi: Faz 3 ölçümünde 0,95 tutmazsa hedef sessizce düşürülmez; bir K- kararı ve ADR ile 0,90 altı hata, 0,95 altı uyarı olur, asıl sert hedef "ilk ürün adı ve fiyatı ilk boyamada (FCP) görünür, FCP ≤ 1,5 sn" olarak kalır.

Ölçümler (Rakım ölçüm sayfası: istemci bileşeni yok, çerçeve tabanı 177 KB gzip, 4 yazı tipi dosyası, LCP öne çıkan ürün fotoğrafı):

| Ölçüm | Performans (3 koşu) | FCP | LCP |
|---|---|---|---|
| Faz 3 yerel, yazı tipi düzeltmelerinden sonra | 0,95 · 0,95 · 0,95 | 1,1 sn | 2,9 sn |
| Faz 3 CI | 0,95 · 0,95 · 0,96 | 1,1 sn | 2,8–2,9 sn |
| Faz 3 canlı (Vercel CDN) | 0,93 · 0,95 · 0,95 | 0,9–1,0 sn | 2,9–3,2 sn |
| D-01 CI (mekân alan adı üzerinden) | 0,93 · 0,95 · 0,99 | 1,1 sn | 2,2–2,9 sn |
| D-01 yerel, ortanca koşu ile | 0,94 · 0,94 · 0,94 | 1,1 sn | 2,9 sn |

Ayrıca D-01'de Lighthouse CI'ın kategori puanlarını varsayılan olarak koşuların **en iyisine** göre değerlendirdiği görüldü. D-01 CI'daki 0,93'lük koşu, 0,99'luk koşunun arkasında saklanmıştı. Ortanca koşuyla dürüst değerlendirildiğinde sayfa 0,94–0,95 arasında salınıyor; 0,95 eşiği güvenilir biçimde tutmuyor.

Puanı belirleyen tek metrik LCP. FCP ve TBT hedefin içinde, CLS 0. LCP'yi, yavaş 4G benzetiminde öne çıkan fotoğrafın JS (177 KB) ve yazı tipleriyle bant genişliği paylaşması belirliyor. Çerçeve tabanı uygulamanın denetiminde değil (Next.js 16.4.3 + React 19.3.1).

## Karar

Menü sayfaları (her mekânın kendi alan adı) için Lighthouse CI kapıları:

| Denetim | Eşik | Düzey |
|---|---|---|
| Performans kategorisi (ortanca koşu) | < 0,90 | **Hata** |
| Performans kategorisi (ortanca koşu) | < 0,95 | Uyarı (hedef görünür kalır) |
| First Contentful Paint (ortanca koşu) | > 1.500 ms | **Hata** (sert hedef) |
| İlk ürün adı ve fiyatı sunucu HTML'inde | yoksa | **Hata** (e2e `site.spec.ts`, D-22'de mekân matrisi) |
| Erişilebilirlik, en iyi uygulamalar (ortanca koşu) | < 0,95 | Hata (değişmedi) |

Bütün kategori kapıları üç koşunun ortanca koşusuyla (`aggregationMethod: "median-run"`) değerlendirilir. Hedef 0,95 olarak kalır ve izlenir: her arayüz dilimi bu sayfayı ölçer, uyarı dilim raporunda yazılır.

## Sonuçlar

- **Olumlu:** CI, makine dalgalanmasıyla rastgele kırmızıya dönmez. Hız vaadinin ziyaretçi açısından anlamlı kısmı (QR'dan sonra ilk ürün ≤ 1,5 sn) sert kapı olarak korunur. 0,95 hedefi görünür kalır.
- **Olumsuz / ödünler:** 0,90–0,95 aralığındaki bir gerileme PR'ı durdurmaz, yalnızca uyarır; uyarıların dilim raporunda yazılması disiplin ister.
- **0,95'e dönme yolu** (bulunursa bu ADR "yerine geçti" olur):
  - D-14: Schibsted Grotesk'in `latin-ext` dosyası (47 KB) yerine yalnızca Türkçe harfleri taşıyan alt küme.
  - D-15: Etkileşimli adacıklar ilk etkileşimde yüklenir.
  - Öne çıkan fotoğrafın boyut ve kalite ayarı.
  - Canlıda ölçüm gerçek CDN ile yapılır.
- **Yeniden değerlendirme koşulu:** Ortanca koşu üç ardışık arayüz diliminde ≥ 0,95 kalırsa performans hata eşiği yeniden 0,95'e çıkar. Sert kapı (FCP) ihlal edilirse dilim kapanmaz.

## Değerlendirilen alternatifler

| Seçenek | Neden seçilmedi |
|---|---|
| 0,95 hata eşiğini korumak | Ortanca koşu 0,94–0,95 arasında salınıyor; CI rastgele kırılır, ya da en iyi koşu seçilerek gerileme saklanır |
| Koşu sayısını artırıp en iyiyi almak | Kapıyı yanıltıcı yapar; D-01'deki 0,93 tam bu yüzden görünmedi |
| Performans kapısını tamamen uyarıya çekmek | Ciddi bir gerileme (< 0,90) de geçerdi; kullanıcı kararı 0,90'ı hata olarak koydu |

## Kaynaklar

- Plan K-17, K-27, K-37; `docs/ilerleme.md` → RSK-01 ölçümü
- `lighthouserc.js` (`assertMatrix`, `aggregationMethod: "median-run"`)
