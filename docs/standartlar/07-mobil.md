# Mobil Standardı

> **Durum:** v1.1 · **Son güncelleme:** 2026-10-23
> **Kararlar:** [Bölüm 11](#11-kararlar)

## 1. Bu belge ne işe yarar

Mobil uyumun "sonra bakarız" işi olmasını engeller. Ziyaretçilerin çoğu telefondan gelir; yönetici de paneli sıklıkla telefondan kullanır. Bu belgedeki her madde **[Z]**'dir ve her dilimin bitti tanımına girer.

## 2. İlkeler

1. **360 px'ten başla.** Temel stil kırılımsız yazılır ve 360 px'e göredir; `sm:`, `md:`, `lg:` yalnızca büyütür. `max-width` medya sorgusu ile masaüstünden küçültme yapılmaz.
2. **Mobil, masaüstünün küçültülmüşü değildir.** Telefonda öncelik değişir: arama, arama düğmesi, yol tarifi, WhatsApp, randevu öne çıkar; uzun tanıtım metni kısalır ya da açılır bölüme girer.
3. **Başparmak bölgesi.** Sık kullanılan eylemler ekranın alt yarısında.
4. **Doğrulanmamış iş bitmemiştir.** Her ekran 360, 390, 768 ve 1280 px'te görülmeden "bitti" denmez; otomatik taşma testi her ekran için çalışır.

## 3. Denetlenen genişlikler

| Genişlik | Temsil ettiği |
|---|---|
| 360 × 800 | Yaygın Android (en dar hedef) |
| 390 × 844 | iPhone |
| 768 × 1024 | Tablet dikey |
| 1024 × 768 | Tablet yatay / küçük dizüstü |
| 1280 × 800 | Dizüstü |
| 1536 × 864 | Geniş ekran |

Playwright projeleri: `mobile` (Pixel 7 profili), `iphone` (iPhone 14 profili, WebKit), `desktop` (1280). S2+ projede ana akış yayından önce gerçek bir iPhone ve bir Android cihazda denenir.

## 4. Gezinme

| Öğe | Kural |
|---|---|
| Üst menü | Mobilde logo + menü düğmesi + (varsa) birincil eylem. Menü tam ekran ya da yandan çekmece; odak tuzağı, `Esc` ile kapanır, açıkken arka plan kaymaz. **JavaScript yüklenmeden de açılır:** HTML `popover` + `popovertarget` (ya da `<details>`) ile kurulur; düğmenin adı "Menü", menünün `aria-label`'ı "Ana menü"dür ([iskelet](../iskelet/src/components/layout/mobile-nav.tsx)). nail-art-studio'da sayfa tam yüklenmeden dokunulan menü açılmıyordu. |
| İlk ekran | Telefonda da ilk ekranda baskın bir görsel bulunur ([20 GK-01](20-gorsel-kalite.md#41-görsel-öncülük)). Eylem çubuğu varsa hero'da tek düğme kalır (GK-14). |
| **Mobil eylem çubuğu** | `<nav aria-label="Hızlı işlemler">`; herkese açık sitede, telefonda altta sabit 2–4 eylem: Ara · WhatsApp · Yol tarifi · Randevu / Teklif. Sektöre göre plan §6'da (sabit öğeler) seçilir. Klavye açıkken gizlenir. İçerik çubuğun altında kalmaz (alt boşluk). |
| Panel | Telefonda **alt sekme çubuğu** (en fazla 5 sekme; fazlası "Daha fazla"), masaüstünde yan menü. |
| Geri dönüş | Detay sayfalarında görünür "geri" bağlantısı; liste filtresi ve kaydırma konumu korunur (filtre URL'de). |
| Uzun sayfa | Bölüm içi bağlantılar (yapışkan sekme çubuğu) ve "başa dön". |

## 5. Tablolar ve yoğun veri

- **Telefonda tablo yerine kart.** Her kart: başlık (ad / kod), en önemli 2–3 alan, durum rozeti, birincil eylem. Diğer alanlar detayda.
- Masaüstü tablosu `md:` kırılımında görünür; aynı veri iki kez çekilmez, aynı listeden iki görünüm üretilir.
- Yatay kaydırmalı tablo yalnızca **karşılaştırma tablosu** gibi doğası gereği geniş içerikte ve yalnızca kendi kabı içinde kayar; sayfa kaymaz, ilk sütun yapışkandır ve kaydırma ipucu vardır.
- Filtreler mobilde "Filtrele (3)" düğmesiyle açılan alt çekmecede; uygulanmış filtreler çip olarak listenin üstünde.
- Takvim görünümleri mobilde gün / ajanda görünümüne düşer; aylık ızgara yalnızca tablet ve üstünde.
- Grafikler mobilde tek seri ve özet sayıyla; ayrıntı dokununca.

## 6. Dokunma ve girdi

- Dokunma hedefi en az **44 × 44 px** (görsel öğe küçükse dolgu ile); bitişik hedefler arasında en az 8 px.
- Giriş alanı yazı boyutu en az **16 px** (iOS otomatik yakınlaştırmasını önler).
- `hover` ile açılan içerik yoktur; her şey dokunmayla da erişilebilir. `hover:` stilleri `@media (hover: hover)` ile sınırlanır.
- Kaydırma hareketiyle yapılan her işin (kaydırarak sil, karusel) bir düğme karşılığı vardır.
- Uygun klavye: telefon, e-posta, sayı, arama (`enterKeyHint`).
- Uzun basma, çift dokunma gibi gizli hareketlere iş bağlanmaz.

## 7. Görünüm alanı

- `viewport`: `width=device-width, initial-scale=1, viewport-fit=cover`; kullanıcı yakınlaştırması **engellenmez**.
- Tam ekran bölümlerde `100vh` değil `100svh` / `100dvh`.
- Alt sabit öğeler `padding-bottom: env(safe-area-inset-bottom)` ile çentik ve ana ekran çubuğundan korunur.
- Yatay taşma kaynakları önceden engellenir: uzun kelime / bağlantı / e-posta (`overflow-wrap: anywhere`), sabit genişlikli görsel ve gömülü içerik (`max-w-full`), negatif kenar boşluğu, `100vw` genişlik.
- Yatay yön (landscape) telefonda içerik okunur kalır; sabit öğeler ekranın yarısından fazlasını kaplamaz.

## 8. Telefona özgü yetenekler

| Yetenek | Kullanım |
|---|---|
| `tel:` | Her telefon numarası tıklanabilir (`PhoneLink`). |
| WhatsApp | `https://wa.me/90…?text=…` önceden doldurulmuş mesajla (sayfa / ilan / hizmet adı). |
| Yol tarifi | Platforma göre Apple / Google Haritalar bağlantısı. |
| Paylaş | Web Share API; desteklenmezse bağlantıyı kopyala. |
| Takvime ekle | `.ics` indirme + Google Takvim bağlantısı (randevu, etkinlik). |
| Kamera / dosya | Yüklemede `accept` ve `capture` (panelde fotoğraf çekip yükleme). |
| PWA [Ö] | Panel ağırlıklı projelerde `manifest` + ana ekrana ekleme; çevrimdışı mod [S]. |

## 9. Performans (mobil koşullar)

- Hedef cihaz orta segment Android, ağ yavaş 4G. Lighthouse **mobil** profiliyle ölçülür ([12-performans](12-performans.md)).
- Görsellerde `sizes` doğru yazılır; telefona masaüstü boyutunda görsel gitmez.
- İlk ekran (LCP) görseli öncelikli yüklenir; ilk ekranın altındaki her şey tembel.
- Mobilde ağır sahne, video arka plan ve büyük animasyon kitaplıkları yüklenmez.

## 10. Otomatik denetim

`tests/e2e/responsive.spec.ts` ([iskelet](../iskelet/tests/e2e/responsive.spec.ts)) her rota listesi için §3'teki genişliklerde:
- `document.documentElement.scrollWidth <= clientWidth` (yatay taşma yok); taşıyorsa taşan öğeyi raporlar,
- görünür etkileşimli öğelerin boyutu ≥ 44 × 44 (istisna listesi: metin içi bağlantılar),
- giriş alanlarında hesaplanmış `font-size` ≥ 16 px,
- mobil eylem çubuğu ve panel sekme çubuğu görünür ve içeriği örtmüyor,
- mobil menü JavaScript kapalıyken açılıyor,
- masaüstü genişliklerinde (1024 / 1280 / 1536) üst başlığın (`banner`) yüksekliği değişmiyor; değişiyorsa menü satır kırıyordur.

Rota listesi `tests/e2e/routes.ts`'tedir; yeni sayfa eklenince bu listeye eklenir (kalite kapısı B).

## 11. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| MB-01 | Yaklaşım | Mobil öncelikli, 360 px tabanı | Brif: mobil [Z] ve baştan. |
| MB-02 | Yoğun veri | Telefonda kart | Bütçe ve Revnak panel deneyimi; yatay kaydırmalı tablo mobilde kullanılamıyor. |
| MB-03 | Mobil eylem çubuğu | Herkese açık sitelerde varsayılan [Z] **[+]** | Yerel işletmelerde dönüşümün büyük kısmı telefonla arama / WhatsApp'tan gelir. |
| MB-04 | Panel gezinmesi | Telefonda alt sekme çubuğu | Revnak / Bütçe; tek elle kullanım. |
| MB-05 | Denetim | Otomatik taşma + hedef boyutu testi | "Yapay zekâ mobili unutuyor" sorununu kurala değil teste bağlar **[+]**. |
| MB-06 | Mobil menü | JS'siz açılan `popover` | nail-art-studio: menü hidrasyondan önce dokunulunca açılmıyordu; yavaş bağlantıda ilk dokunuş kaybolur. |
| MB-07 | Başlık kırılması | Masaüstü genişliklerinde banner yüksekliği sabit (testli) | nail-art-studio: panel üst menüsü geniş ekranda iki satıra bölünüyordu; taşma testi bunu görmez. |

## 12. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | JS'siz mobil menü, telefonda ilk ekran görseli, başlık kırılması testi (MB-06, MB-07). |
