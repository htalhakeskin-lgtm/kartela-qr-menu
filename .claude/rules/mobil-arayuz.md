---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Arayüz ve mobil (her .tsx / .css düzenlemesinde)

Tam kurallar: docs/standartlar/06-arayuz.md, 07-mobil.md, 08-erisilebilirlik.md, 20-gorsel-kalite.md

- **Önce 360 px.** Temel sınıflar telefona göre yazılır; `sm:` / `md:` / `lg:` yalnızca büyütür. Masaüstüne göre yazıp sonra küçültmek yasak.
- Yatay kaydırma yok: sabit genişlik (`w-[600px]`), `min-w` ile taşan tablo, kırılmayan uzun kelime (`break-words`) kontrol edilir.
- Dokunma hedefi ≥ 44 × 44 px; yan yana hedefler arasında ≥ 8 px.
- Telefonda tablo yerine kart listesi; filtreler alttan açılan panelde; ana eylem başparmak bölgesinde (alt çubuk / yapışkan düğme), `env(safe-area-inset-bottom)` ile.
- Giriş alanları ≥ 16 px yazı (iOS yakınlaştırması), doğru `type` / `inputMode` / `autoComplete`.
- Renk, boşluk, yarıçap yalnızca tasarım token'larından; ham renk kodu yazma.
- Konsept (plan §11) ölçüttür: degrade leke, parıltı süsü, cam efekti, her bölümü kart içine alma, kartları farklı pastel tonlarla renk kodlama yok. Tek hâkim renk, vurgu ≤ %10.
- Telefonda ilk ekranda baskın görsel; eylem çubuğu varken hero'da tek düğme. İkincil düğme çerçeveli ya da metin, soluk dolgulu değil.
- Görsel `next/image` + doğru `sizes`; elle `srcset` yok; bir görsel sitede tek rolde.
- Mobil menü `popover` + `popovertarget` ile JS'siz açılır.
- İş bitince 1440 ve 390 px ekran görüntüsünü aç ve bak (20 §7); kodu okumak görünümü doğrulamaz.
- Her veri gösteren ekranın yükleniyor (300 ms sonra iskelet), boş ve hata durumu var.
- Etkileşimli öğe gerçek `<button>` / `<a>`; görünür odak; ikon düğmede `aria-label`.
- Animasyon yalnızca `transform` / `opacity`; `prefers-reduced-motion`'da kapanır.
- Metin Türkçe, cümle düzeninde; değişken değere ek getirme; biçimler `@/lib/format`'tan.
- Görsel: `next/image`, `sizes` ve en-boy oranı verilir; LCP görseline `priority`.
- Bittiğinde: `pnpm test:e2e --grep @responsive` ve 360 / 1280 px ekran görüntüsünü incele.
