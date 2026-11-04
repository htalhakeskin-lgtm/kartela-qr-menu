# ADR-0005: Statik menü sayfaları; zaman, bağlam ve kişisel durum istemcide

> **Durum:** Önerildi · **Tarih:** 2026-11-04

## Bağlam

Hız hedefleri: menü sayfaları statik üretilir ve değişince etiketle yenilenir; QR'dan sonra ilk ürün 4G'de ≤ 1,5 sn; Lighthouse mobil performans ≥ 95; son açılan menü internet yokken açılır. Öte yandan menünün bir kısmı **istek anına** bağlı: saat pencereleri (kahvaltı 08–12), saate göre tema değerleri, QR bağlamı (masa, oda, şezlong), tükendi ve günlük adet, Seçtiklerim, seçilen görünüm.

## Karar

1. **Sayfa = bütün veri, statik.** Hızlı menü, Keşfet, ürün ve bilgi sayfaları `generateStaticParams` (mekân × dil) ve Cache Components (`"use cache"`, `cacheLife("max")`, `cacheTag("menu:{mekan}")`) ile üretilir. Panel eylemi `updateTag` ile yalnızca o mekânın etiketini yeniler; sonraki istek yeni sayfayı alır.
2. **Zamana bağlı her şey istemcide.** Statik sayfa bütün menüleri ve pencerelerini taşır. Küçük, satır içi bir ön boyama betiği (`<head>`'de; statik sayfaların CSP'sindeki `'unsafe-inline'` kapsamında — özet **eklenmez**, çünkü CSP 2+ tarayıcılarda özet `'unsafe-inline'`'ı geçersiz kılar ve Next.js'in kendi satır içi betiklerini kırar, plan K-33) `Europe/Istanbul` saatini hesaplar ve `<html data-gun-dilimi="sabah" data-menu="kahvalti">` yazar; CSS bu özniteliklerle etkin menüyü öne alır ve gün dilimi token'larını uygular. Böylece kayma (CLS) ve parlama olmaz. Hidrasyondan sonra `useActiveMenus` dakikada bir yeniden hesaplar.
3. **Tarihe bağlı olanlar sunucuda, günlük.** Mevsim ve "günün menüsü" tarih bilgisidir: Vercel cron her gün 04:00'te (`Europe/Istanbul`) bütün mekânların `menu:` etiketini yeniler; tükendi işaretleri de bu saatte kendiliğinden düşer (P-01). Hobby'de günde bir cron yeterli.
4. **Bağlam istemcide.** QR adresi `https://{mekan}/?b={kod}`. Sayfa statik kalır (`searchParams` okunmaz); istemci kodu kayıtlı bağlamlardan çözer (bağlam listesi sayfada; gizli değildir), başlıkta "Masa 12" gösterir, bağlama özgü menüleri ve token'ları uygular, `sessionStorage`'a yazar. Bilinmeyen kod yok sayılır (BR-BGL-001).
5. **Gizli bölüm statik HTML'de yoktur.** Şifre sunucu eyleminde doğrulanır (hız sınırlı), içerik o anda döner ve oturumluk çerezle hatırlanır. Basılı ve kapı önü listesinde ürün adı ve fiyatı yine bulunur (BR-YSL-003).
6. **Kişisel durum tarayıcıda.** Seçtiklerim `localStorage` (mekân anahtarlı); görünüm seçimi çerez (proxy okur, [ADR-0002](0002-kiraci-cozumleme-ve-alan-adi-haritasi.md)).
7. **Çevrimdışı.** Mekân başına servis çalışanı (`/sw.js`, kapsam mekânın kökü; yol önekli önizlemede `/m/{slug}/`). Strateji: menü HTML'i ve RSC yükü için "ağ önce, 3 sn sonra önbellek"; görseller için "önbellek önce" (en çok 60 görsel, P-05); panel ve `/api` hiç önbelleğe alınmaz. Çevrimdışı açılışta üstte "Çevrimdışı · son güncelleme 14:05" notu. Kütüphane yok, el yazımı ~100 satır (bütçe).
8. **İstemci JS bütçesi.** Uygulama payı mekân rotası başına ≤ 50 KB gzip ([12 §3](../standartlar/12-performans.md)). Filtre paneli, ürün kurucu ve galeri ilk etkileşimde ayrı parça olarak yüklenir. Ölçüm her mekânın kendi alan adında `pnpm olcum:js --mekan {slug}`.

## Sonuçlar

- **Olumlu:** CDN'den statik HTML; veritabanı uykusu menüyü bekletmez; zaman ve bağlam her istekte sunucu render'ı gerektirmez; çevrimdışı açılış doğal.
- **Olumsuz / ödünler:** Etkin menü ilk HTML'de kesin değildir (ön boyama betiğiyle telafi); statik sayfalarda `script-src 'unsafe-inline'` kalır (Next.js'in nonce'suz satır içi betikleri; XSS'e karşı asıl savunma React'in kaçışlaması ve `dangerouslySetInnerHTML` yasağıdır); günlük adet gibi sık değişen değerler her güncellemede sayfa yeniden üretimi demektir (Hobby'de ISR yazma kotası izlenir).
- **Yeniden değerlendirme koşulu:** Masadan sipariş (P2) gelince sipariş durumu gibi gerçek zamanlı parçalar `Suspense` içinde dinamik ada olarak eklenir; menü gövdesi statik kalır.

## Değerlendirilen alternatifler

| Seçenek | Neden seçilmedi |
|---|---|
| İstek anında sunucu render'ı (`connection()` + saat) | Her QR okutmada fonksiyon çağrısı ve soğuk veritabanı riski; ≤ 1,5 sn hedefi ve ≥ 95 performans tehlikeye girer |
| Saat dilimine göre ayrı statik sayfalar + proxy seçimi | Sayfa sayısı katlanır; dakikalık sınırlar (11:59 → 12:00) için yine istemci gerekir |
| Bağlamı yola gömmek (`/masa/12`) ve her bağlam için statik sayfa | 100 masalık mekânda 100 kopya; bağlam sırrı değil, istemcide çözmek yeterli |
| Workbox / Serwist | Ek bağımlılık ve paket; ihtiyaç tek mekân kapsamlı basit bir strateji |
