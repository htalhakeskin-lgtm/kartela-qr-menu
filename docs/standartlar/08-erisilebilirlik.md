# Erişilebilirlik

> **Durum:** v1.0 · **Son güncelleme:** 2026-10-16
> **Kararlar:** [Bölüm 9](#9-kararlar)

## 1. Bu belge ne işe yarar

Her projenin **WCAG 2.2 AA** hedefini nasıl karşılayacağını tanımlar. Erişilebilirlik ayrı bir dilim değildir; her bileşen ilk yazıldığında erişilebilir yazılır.

## 2. Yapı ve anlam

- Her sayfada tek `<h1>`; başlık seviyeleri atlanmaz.
- Bölge öğeleri: `header`, `nav` (birden fazlaysa `aria-label`), `main`, `footer`; "İçeriğe geç" bağlantısı ilk odaklanan öğedir.
- Listeler `ul` / `ol`, veri tabloları `table` + `th` + `scope` + `caption`.
- Yerel HTML öğesi varsa ARIA ile yeniden yapılmaz (`button`, `a`, `details`, `dialog`, `input type="date"` yerine erişilebilir tarih seçici).
- `lang="tr"`; başka dilde bölüm varsa o öğede `lang`.
- Sayfa başlığı (`<title>`) her sayfada benzersiz: "Diş Beyazlatma · {Firma}".

## 3. Klavye ve odak

- Tüm işlevler yalnızca klavyeyle kullanılabilir; sekme sırası görsel sırayla aynı.
- Odak halkası her zaman görünür (`focus-visible`, `ring` token'ı, en az 2 px, 3:1 kontrast). `outline: none` yalnızca yerine eşdeğer halka varsa.
- Odaklanan öğe yapışkan başlık ya da alt çubuk tarafından **örtülmez** (WCAG 2.2, 2.4.11): `scroll-padding-top` / `scroll-padding-bottom` ayarlanır.
- Diyalog ve çekmece: açılınca içine odak, kapanınca açan öğeye dönüş, `Esc` kapatır, arka plan `inert`.
- Sayfa içi gezinmede (istemci yönlendirmesi) odak yeni sayfanın başlığına taşınır.

## 4. Formlar

- Her alanın görünür `<label>`'ı vardır; grup alanlar `fieldset` + `legend`.
- Hata mesajı alana `aria-describedby` ile bağlı, `aria-invalid="true"`; gönderimde hata özeti + ilk hatalı alana odak.
- Zorunluluk hem görsel hem `required` / `aria-required`.
- Aynı süreçte daha önce girilen bilgi tekrar istenmez ya da otomatik doldurulur (WCAG 2.2, 3.3.7).
- Giriş ekranında bilişsel test yok; parola yapıştırma ve parola yöneticisi engellenmez (3.3.8). Doğrulama kodu alanı `autocomplete="one-time-code"`.
- Zaman sınırlı işlemde (ör. sepette tutulan randevu) süre uzatılabilir ve önceden uyarılır.

## 5. Renk, metin ve görsel

- Kontrast: gövde metni 4.5:1, büyük metin (≥ 24 px ya da ≥ 18.66 px kalın) ve arayüz öğeleri 3:1. Token çiftleri testle denetlenir ([06 §3](06-arayuz.md#3-tasarım-tokenları)).
- Renk tek başına bilgi taşımaz (durum rozetinde metin, grafikte desen / etiket, formda ikon + metin).
- Metin %200 büyütüldüğünde ve 320 px genişlikte içerik kaybolmaz (yeniden akış).
- Anlamlı görselin `alt` metni içeriği anlatır ("Kompozit dolgu öncesi ve sonrası, alt çene"); süs görseli `alt=""`.
- Metin içeren görsel kullanılmaz (logo hariç).
- Video: altyazı; otomatik oynatılan video sessiz ve durdurulabilir.

## 6. Dinamik içerik ve hareket

- Form sonucu, sepet güncellemesi, filtre sonucu sayısı `aria-live="polite"` bölgesiyle duyurulur ("12 ilan bulundu").
- Yükleniyor durumunda `aria-busy`.
- Otomatik değişen içerik (karusel, haber bandı) durdurulabilir; 5 saniyeden uzun hareket kullanıcı kontrolündedir.
- `prefers-reduced-motion` uygulanır ([06 §9](06-arayuz.md#9-hareket)).
- Sürükle bırak ile yapılan her işin tek dokunuşla / düğmeyle karşılığı vardır (2.5.7): sıralamada "Yukarı / Aşağı taşı" düğmeleri.

## 7. Test

| Test | Ne zaman | Araç |
|---|---|---|
| Otomatik tarama | Her e2e çalışmasında, tüm rotalarda | `@axe-core/playwright` (ciddi / kritik ihlal = test başarısız) |
| Kontrast | Token değişince | Birim testi |
| Klavye turu | Her dilim sonunda, yayından önce tam tur | Elle: menü, formlar, diyaloglar, panel |
| Ekran okuyucu | S3+ yayından önce ana akış | VoiceOver (iOS / macOS) ya da TalkBack / NVDA |
| Yakınlaştırma | Yayından önce | Tarayıcı %200 + 320 px |

Otomatik araçlar sorunların yalnızca bir kısmını yakalar; elle klavye turu atlanmaz.

## 8. Erişilebilirlik beyanı [Ö]

S3+ ve kamu / sağlık / eğitim projelerinde `/erisilebilirlik` sayfası: hedeflenen düzey, bilinen eksikler, iletişim yolu, son değerlendirme tarihi.

## 9. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| ER-01 | Hedef | WCAG 2.2 AA | ERP ui.md ve brif; 2.2'nin odak örtülmesi, hedef boyutu, tekrar giriş kriterleri mobil ağırlıklı sitelerde doğrudan ilgili. |
| ER-02 | Hedef boyutu | 44 px (WCAG AA'nın 24 px'inin üstünde) | Mobil standardıyla tek kural. |
| ER-03 | Otomatik tarama | Her rota, her e2e çalışması | Gerilemeyi PR'da yakalar. |

## 10. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
