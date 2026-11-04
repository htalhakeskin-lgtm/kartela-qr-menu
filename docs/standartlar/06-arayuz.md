# Arayüz ve Tasarım Sistemi

> **Durum:** v1.2 · **Son güncelleme:** 2026-10-30
> **Kararlar:** [Bölüm 12](#12-kararlar)

## 1. Bu belge ne işe yarar

Her projenin görsel dilini token'lar, bileşen kuralları, ekran durumları ve hareket ilkeleriyle tanımlar. Bu belge yapıyı verir; **kalite çıtası, konsept süreci ve görsel seçimi** [20-gorsel-kalite](20-gorsel-kalite.md)'dedir. Mobil kurallar [07-mobil](07-mobil.md)'de, erişilebilirlik [08-erisilebilirlik](08-erisilebilirlik.md)'tedir.

## 2. Tasarım ilkeleri

1. **Önce konsept.** Her projenin adlı bir konsepti (plan §11.1; "Sinematik lüks" gibi) ve bir "imza öğesi" vardır: diş kliniğinde gülüş öncesi / sonrası kaydırıcısı, restoranda menüden masaya akış, emlakta harita + ilan bölünmüş görünümü. Hazır tema görünümü (degrade leke, parıltı süsü, pastel renkli eşit kartlar, genel stok fotoğraf) kabul edilmez; denetim listesi [20 §4](20-gorsel-kalite.md#4-profesyonel-görünüm-çıtası)'tedir.
2. **Önce içerik ve eylem.** Her sayfada tek bir birincil eylem vardır ve ilk ekranda görünür (Ara, Randevu al, Teklif iste).
3. **Yararlı zenginlik.** Zenginlik süsle değil işlevle gelir: fiyat hesaplayıcı, uygunluk takvimi, karşılaştırma, filtre, harita. Süs öğesi ancak işlevsel öğeler tamamlandıktan sonra eklenir.
4. **Tutarlılık token'dan gelir.** Renk, yazı, aralık, yarıçap, gölge kodda elle yazılmaz; yalnızca token sınıfları kullanılır.
5. **Durumsuz ekran yoktur.** Her veri gösteren ekran yükleniyor, boş, hata ve (varsa) kısmi durumlarıyla tasarlanır.
6. **Görüntüye bakılarak biter.** Bir ekran kodu okunarak değil, ekran görüntüsü incelenerek onaylanır ([20 §7](20-gorsel-kalite.md#7-görsel-inceleme-turu)).

## 3. Tasarım tokenları

Token'lar `src/app/globals.css` içinde CSS değişkeni olarak tanımlanır ve Tailwind 4 `@theme` ile sınıfa dönüşür. Tema presetleri yalnızca değişkenleri değiştirir (`[data-theme="…"]`).

**Tanımsız token işareti:** Prettier'ın Tailwind eklentisi tanımadığı sınıfı listenin başına alır. Biçimlendirmeden sonra başa kaymış bir sınıf (`bg-muted` gibi) projede olmayan bir token'dır ve hiçbir stil üretmez; Levha'da rapor çubuklarının izi bu yüzden görünmüyordu (D-052). Projenin token adları (`surface-muted`, `border`…) kullanılır.

| Grup | Token'lar | Kural |
|---|---|---|
| Renk: yüzey | `background`, `foreground`, `surface`, `surface-muted`, `border`, `input`, `ring` | Nötrler hafif sıcak ya da soğuk tonlu; saf siyah / beyaz metin yok |
| Renk: marka | `primary`, `primary-foreground`, `accent`, `accent-foreground` | **Tek hâkim renk** + bir vurgu; vurgu yüzeyin %10'unu geçmez |
| Renk: anlam | `success`, `warning`, `danger`, `info` (+ `-foreground`, `-muted`) | Durum rozetleri ve uyarılar; marka rengiyle karışmaz |
| Yazı | `font-sans`, `font-display` (isteğe bağlı), boyut ölçeği `text-xs` … `text-5xl` | Gövde en az 16 px |
| Aralık | Tailwind 4 px ölçeği; bölüm aralığı `--section-y` (mobil 64 px, masaüstü 112 px) | Rastgele `mt-[37px]` yok |
| Yarıçap | `--radius` tek temel değer; `sm`, `md`, `lg`, `xl` ondan türer | Projenin karakterine göre: kurumsal 6–8 px, sıcak 12–16 px |
| Gölge | `shadow-sm`, `shadow-md`, `shadow-lg` (renkli, düşük opaklık) | Gölge katman belirtir, süs değildir |
| Hareket | `--ease-out`, `--ease-in-out`, `--duration-fast` (150 ms), `--duration-base` (250 ms), `--duration-slow` (400 ms) | [§9](#9-hareket) |
| Kırılım | `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536 | Mobil öncelikli: temel stil kırılımsız yazılır |

```css
/* src/app/globals.css (özet) */
@import "tailwindcss";

:root {
  --background: oklch(0.99 0.004 85);
  --foreground: oklch(0.22 0.02 260);
  --primary: oklch(0.52 0.13 195);          /* tek hâkim renk */
  --primary-foreground: oklch(0.99 0 0);
  --radius: 0.75rem;
}
[data-theme="gece"] { --background: oklch(0.18 0.015 260); /* … */ }

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --radius-lg: var(--radius);
}
```

**Kontrast testi** (S2+): her ön plan / arka plan token çifti için WCAG AA (metin 4.5:1, büyük metin ve arayüz öğesi 3:1) birim testiyle denetlenir; yeni preset bu testten geçmeden eklenmez.

## 4. Tipografi

- Yazı tipi `next/font` ile kendi sunucumuzdan; **`latin-ext` alt kümesi zorunlu** (ğ, ş, ı, İ). Seçilen yazı tipinde Türkçe karakterler görsel olarak denetlenir (özellikle `İ` noktası ve `ş` çengeli).
- En fazla iki aile (gövde + başlık) ve toplam dört ağırlık.
- Ölçek: mobilde başlıklar `clamp()` ile akışkan; `h1` mobilde 32–40 px, masaüstünde 48–64 px.
- Satır uzunluğu gövde metninde 60–75 karakter (`max-w-prose`); satır yüksekliği gövde 1.6, başlık 1.1–1.25.
- Rakam içeren tablolarda `tabular-nums`.
- Başlıklar `text-balance`, paragraflar `text-pretty`.

## 5. Yerleşim ve aralık

- İçerik kabı: `max-w-7xl` + yan boşluk mobilde 16 px, tablette 24 px, masaüstünde 32 px.
- Izgara mobilde tek sütun; kart ızgaraları `grid-cols-[repeat(auto-fill,minmax(…,1fr))]` ile kırılımsız uyum sağlar.
- Bölümler arası boşluk `--section-y`; bölüm içi hiyerarşi 8 px katlarıyla.
- Yapışkan öğeler (üst menü, mobil eylem çubuğu) içerik alanından düşülür; hiçbir içerik bunların altında kalmaz.

## 6. Bileşen kuralları

| Bileşen | Kural |
|---|---|
| Düğme | Varyantlar: `default` (birincil), `secondary`, `outline`, `ghost`, `destructive`, `link`. Ekranda tek birincil. İkincil düğme çerçeveli ya da yalnızca metindir; soluk gri / pembe-gri dolgu devre dışı gibi okunur, kullanılmaz (GK-15). Yükleniyorken metin korunur, yanına dönen ikon gelir, düğme devre dışı kalır. Yalnızca ikonlu düğmede `aria-label`. |
| Bağlantı / düğme ayrımı | Sayfa değiştiren öğe `<a>` (`Link`), eylem yapan öğe `<button>`. |
| Kart | Tıklanabilir kartta tüm kart tek bağlantıdır (içte ikinci bağlantı yok ya da "stretched link" deseni). |
| Diyalog | Mobilde alt çekmece (`Drawer`), masaüstünde ortada (`Dialog`). Yıkıcı işlem onayı nesnenin adını içerir: "‘Diş beyazlatma’ hizmeti arşivlensin mi?" |
| Bildirim (toast) | Yalnızca başarı ve geri alınabilir işlem bildirimi; hata formda ya da sayfada kalıcı gösterilir. 5 sn, "Geri al" eylemi varsa 8 sn. |
| Rozet | Durum rengi anlam token'ından; renk tek başına anlam taşımaz, metin de vardır. |
| Tablo | Masaüstünde tablo, mobilde kart listesi ([07 §5](07-mobil.md#5-tablolar-ve-yoğun-veri)). |
| Sayı | Para, tarih, telefon yalnızca `MoneyText`, `DateText`, `PhoneLink` ortak bileşenleriyle. |
| Harita | Tembel yüklenir; yüklenmeden önce statik önizleme + "Haritayı göster" düğmesi; altında metin adres ve "Yol tarifi al" bağlantısı. |

## 7. Ekran durumları

| Durum | Desen |
|---|---|
| Yükleniyor | İçeriğin şeklinde iskelet (`Skeleton`); 300 ms'den kısa yüklemede gösterilmez. Sayfa düzeyinde `loading.tsx`. |
| Boş | Neden boş + ne yapılabilir + birincil eylem. "Henüz hizmet eklenmedi. İlk hizmetinizi ekleyin." Filtre sonucu boşsa "Filtreleri temizle". |
| Hata | Ne oldu + tekrar dene + destek kodu. Sayfa düzeyinde `error.tsx`, bölüm düzeyinde hata sınırı. |
| Kısmi | Bir bölüm hata verirse sayfanın geri kalanı çalışır (ör. yorumlar yüklenemedi, sayfa açık). |
| Yetkisiz | Panelde giriş ekranına yönlendirme, dönüş adresi korunur. |
| Bulunamadı | Özel `not-found.tsx`: arama kutusu + popüler sayfalar + ana sayfa bağlantısı. |

## 8. Formlar

- Etiket alanın üstünde, her zaman görünür; yer tutucu etiketin yerini tutmaz.
- Zorunlu alanlar işaretlenir; isteğe bağlı alan azsa "(isteğe bağlı)" yazılır.
- Doğru klavye: `type="tel"`, `type="email"`, `inputMode="numeric"`, `autoComplete` değerleri (`name`, `tel`, `email`, `street-address`).
- Hata alanın altında, `aria-describedby` ile bağlı; gönderimde ilk hatalı alana odak.
- Uzun formlar adımlara bölünür (en fazla 5 alan / adım), ilerleme göstergesiyle; girilen veri adımlar arasında korunur.
- Gönderim sonrası teşekkür ekranı sonraki adımı söyler: "Talebiniz alındı (RND-2026-0042). 30 dakika içinde sizi arayacağız."
- Tarih seçici Türkçe, hafta pazartesi başlar; kapalı günler seçilemez.

## 9. Hareket

- Yalnızca `transform` ve `opacity` canlandırılır; düzen kaydıran özellik (width, height, top, margin) canlandırılmaz.
- Süreler: geri bildirim 150 ms, geçiş 250 ms, büyük sahne 400 ms; 600 ms'yi aşan arayüz animasyonu yok.
- `prefers-reduced-motion: reduce` iken kaydırma sahneleri, paralaks ve otomatik oynayan döngüler kapanır; Lenis devre dışı kalır; geçişler anında olur.
- Otomatik kaydırılan karusel yoktur; varsa durdurma düğmesi ve görünür kontrolleri vardır.
- Kaydırmayla tetiklenen giriş animasyonları bir kez oynar ve içeriği gizli bırakmaz (JS yüklenmezse içerik görünür).
- [S] Ağır sahne (Lenis, büyük Motion zinciri) yalnızca masaüstünde ve performans bütçesi ölçülerek.

## 10. Görsel ve ikon

- İkon seti tek: lucide. İkon tek başına anlam taşımaz (metin ya da `aria-label`).
- Fotoğraflar konsepte uygun, seri gibi tutarlı ve yeterli çözünürlükte seçilir; arama, kabul ölçütleri ve teslim [20 §5–6](20-gorsel-kalite.md#5-görsel-araştırma-ve-seçim)'dadır, lisans kaydı [17 §5](17-icerik-ve-demo-verisi.md#5-görseller)'tedir.
- Her görselin en-boy oranı sabittir (`aspect-*`), yüklenirken düzen kaymaz.
- Logo SVG; favicon seti ve `manifest.ts` her projede.
- Karanlık mod [Ö]: varsayılan değildir; seçilirse tüm token'lar için ayrı değer, sistem tercihine uyum ve elle geçiş.

## 11. Türkçe arayüz metni

- Büyük harf yalnızca CSS (`uppercase`) ile, yalnızca kısa etiketlerde (rozet, üst başlık) ve `<html lang="tr">` sayesinde doğru `İ` ile. Uzun metin büyük harfe çevrilmez.
- Değişken değere ek getirilmez: "{şehir}'e teslimat" değil "Teslimat şehri: {şehir}".
- Sayı biçimleri: `1.234,56 ₺`, `%15`, `120 m²`, `15 Ekim 2026`, `14:30`. Para simgesi sonda, araya boşluk.
- Hitap tutarlı: ziyaretçi metinlerinde "siz"; düğmelerde emir kipi ("Randevu al", "Teklif iste").
- Hata, boş durum ve onay metinleri plan §6'daki ekran listesinde yazılır; geliştirme sırasında uydurulmaz.

## 12. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| AR-01 | Renk disiplini | Tek hâkim renk + nötrler + anlam renkleri | Revnak'taki sade, güven veren görünüm; brifin "tutarlı tasarım" isteği. |
| AR-02 | Token kaynağı | CSS değişkeni + Tailwind 4 `@theme` | Tema panelden değişebilir (VetFlow). |
| AR-03 | Büyük harf | Yalnızca CSS, kısa etikette | ERP ui.md'deki büyük harfli etiket kuralı Türkçe İ / ı sorununa açıktı; kural daraltıldı. |
| AR-04 | Animasyon | `transform` / `opacity`, ≤ 400 ms (sahne hariç) | Performans + erişilebilirlik. |
| AR-05 | Toast | Hata toast'la gösterilmez | Kaybolan hata mesajı okunamaz; erişilebilirlik. |
| AR-06 | Konsept | Plan §11'de adlı konsept + değerli token tablosu | nail-art-studio'da "zarif ve sıcak" gibi bir sıfat konsept yerine geçti ve sonuç pastel bir şablon oldu. Revnak'ta adlı konsept tutarlı ve seçkin bir sonuç verdi. Ayrıntı [20 SY-01](20-gorsel-kalite.md#9-kararlar). **[+]** |
| AR-07 | İkincil düğme | Çerçeveli ya da metin | nail-art-studio'da soluk dolgulu ikincil düğmeler devre dışı gibi göründü. |
| AR-08 | Alt bilgi imzası | Son satırda "Created by Talha Keskin", sitenin etiket stiliyle (`site-credit.tsx`) | Kullanıcı isteği (Levha K-78, D-054); ayrıntı [17 §3](17-icerik-ve-demo-verisi.md#3-kurgusal-kimlikler). |

## 13. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | İlke 1 "önce konsept" oldu, ilke 6 eklendi; görsel seçimi 20-gorsel-kalite'ye bağlandı; AR-06, AR-07. |
| 2026-10-30 | v1.2 | Tanımsız token işareti (D-052); alt bilgi imzası (AR-08, D-054). |
