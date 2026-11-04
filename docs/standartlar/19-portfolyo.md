# Portfolyo Çıktıları

> **Durum:** v1.1 · **Son güncelleme:** 2026-10-30
> **Kararlar:** [Bölüm 9](#9-kararlar)

## 1. Bu belge ne işe yarar

Her projenin sonunda (Faz 7) aynı kalitede portfolyo paketi üretilmesini sağlar: ekran görüntüleri, cihaz mockup'ları, `portfolyo.md` ve LinkedIn metni. Ekran listesi plan §21'de, proje başında belirlenir; böylece ekranlar "portfolyoda nasıl görünecek" bilinciyle tasarlanır.

## 2. Klasör yapısı

```
portfolyo/
├── screenshot/                  ham ekran görüntüleri (otomatik)
│   ├── 01-ana-sayfa-masaustu.png
│   ├── 02-ana-sayfa-mobil.png
│   ├── 03-ilan-detay-masaustu.png
│   └── 1x-panel-pano-masaustu.png
├── mockup/                      cihaz çerçeveli kompozisyonlar
│   ├── 01-kapak.png             masaüstü + telefon (ana görsel)
│   ├── 02-mobil-uclu.png        [Ö] üç telefon yan yana
│   └── 03-panel.png             [Ö] panel + telefon
├── araclar/                     mockup.html, mockup.mjs (sistemden kopya)
└── portfolyo.md                 metinler
```

## 3. Ekran görüntüleri

**Adlandırma:** `{sıra}-{ekran}-{cihaz}.png`; sıra iki haneli, ekran Türkçe ASCII kebab-case, cihaz `masaustu` / `mobil` / `tablet`. Sıra, anlatı sırasıdır (vitrin → ana özellik → mobil → panel).

**Üretim:** `pnpm screenshots` → `tests/e2e/ekran-goruntusu.spec.ts` ([iskelet](../iskelet/tests/e2e/ekran-goruntusu.spec.ts)). Liste plan §21'den `portfolyo/ekranlar.json`'a aktarılır.

**Hazırlık adımları:** bir ekran tıklama ya da form doldurma sonrasındaysa (ışık kutusu açık, sihirbazın ikinci adımı) kayda `hazirla` dizisi yazılır: `{ "doldur": seçici, "metin": … }`, `{ "tikla": seçici }`, `{ "bekle": seçici }` (Playwright seçicileri). Yerel `<dialog>` için `dialog[open]` kullanılır; `[role=dialog]` CSS seçicisi örtük rolü görmez. Panel ekranları `"panel": true` ile e2e'nin oturum dosyasını kullanır. Belirteçli bir sayfa (takip bağlantısı) gerekiyorsa yol yer tutucusu (`{takip}`) projenin testinde veritabanından üretilir; paralel işçilerde aynı belirteç için sabit bir tohumdan türetilir. Yakınlaştırma gibi geç yüklenen görseller çekim anında boş kalabilir; çekilen her görüntü açılıp bakılır.

| Ayar | Masaüstü | Mobil |
|---|---|---|
| Görünüm alanı | 1440 × 900 | 390 × 844 |
| Cihaz ölçeği | 2× (2880 px genişlik) | 3× |
| Tam sayfa | Ana sayfa ve uzun sayfalarda ayrıca `-tam` sonekli | Aynı |

**Çekim öncesi:**
- Demo veritabanı sıfırlanır (`pnpm db:reset`); tarihler bugüne göre üretildiği için takvim ve pano dolu görünür.
- Animasyonlar tamamlanmış: `reducedMotion: "reduce"` ile sahneler son karesinde; tembel görseller yüklenmiş, yazı tipleri hazır (`document.fonts.ready`).
- Çerez bandı kapatılmış (tercih önceden yazılır); demo şeridi **görünür kalır** (dürüstlük).
- Panel görüntülerinde gerçekçi yoğunluk: boş tablo yok, uç durum kayıtları görüntünün dışında.
- İmleç, kaydırma çubuğu, geliştirme göstergeleri görünmez.

**En az liste (seviyeye göre):**

| S1 | S2 | S3 / S4 |
|---|---|---|
| Ana sayfa (M + T), ana hizmet / ürün sayfası (M + T), iletişim / form (T), panel talep kutusu (M) | S1 + ana dönüşüm akışının adımları (T), blog / detay (M), panel pano (M + T) | S2 + imza öğesi, harita / filtre, CRM hunisi, takvim, raporlar, hesap alanı |

(M: masaüstü, T: telefon)

## 4. Mockup

**Ana görsel (`01-kapak.png`):** referans `01-kapak.jpg` düzeni.
- Tuval 2560 × 1600 (16:10), koyu ve hafif degrade zemin (projenin nötr koyu tonuyla).
- Solda masaüstü tarayıcı çerçevesi (pencere düğmeleri, boş adres çubuğu), tuvalin ~%75'i.
- Sağ altta telefon çerçevesi tarayıcının üstüne bindirilmiş; **farklı bir ekran** gösterir (ör. masaüstünde ana sayfa, telefonda ilan detayı + mobil eylem çubuğu). Böylece tek görselde hem vitrin hem mobil deneyim anlatılır.
- Yumuşak, geniş gölge; yazı, logo ya da süs eklenmez.

**Ek mockup'lar [Ö]:** üç telefon yan yana (akış adımları), panel masaüstü + telefonda aynı modül.

**Sınır:** Mockup toplam **1–3 adet**tir; bunların dışındaki tüm görseller doğrudan ekran görüntüsüdür.

**Üretim:** `portfolyo/araclar/mockup.html` çerçeveleri ve yerleşimi CSS ile çizer; `pnpm mockup` (`node portfolyo/araclar/mockup.mjs`) Playwright ile PNG'ye çevirir; argümansız çalışınca ilk masaüstü ve ilk mobil görüntüden kapak + kare + dikey varyantları üretir, `--duzen uclu --telefon … --telefon2 … --telefon3 …` üç telefonlu görseli verir (tarayıcı bulunamazsa `CHROMIUM_PATH`) ([iskelet/portfolyo/araclar](../iskelet/portfolyo/araclar/mockup.html)). Telif sorunlu cihaz görselleri kullanılmaz; çerçeveler kodla çizilir.

## 5. `portfolyo.md`

[Şablon](../sablonlar/portfolyo.md). Bölümler: özet, problem → çözüm, öne çıkan özellikler, teknik + mühendislik notları, rakamlarla, görseller (her görsel için **başlık + 1–2 cümle açıklama**), LinkedIn, diğer kısa metinler.

**Dürüstlük kuralları:**
- Rakamlar yalnızca ölçümden: test sayısı CI çıktısından, Lighthouse rapordan, sayfa / kayıt sayısı veritabanından; ölçüm tarihiyle.
- Kurgusal proje "müşteri projesi" gibi sunulmaz; "konsept / demo proje" ifadesi kullanılır. Gerçek müşteri projesinde müşterinin izni alınır.
- Ekip çalışmasıysa kişinin kendi katkısı ayrı yazılır. Yapay zekâ destekli geliştirme gizlenmez; istenirse "Claude Code ile geliştirildi, mimari ve kararlar bana ait" gibi açık bir cümle.

## 6. LinkedIn metni

- Uzunluk ≈ 1.300 karakter; ilk iki satır "daha fazlasını gör" öncesinde görünür, en güçlü kancayı taşır (problem ya da sonuç).
- Yapı: kanca → ne yapıldı (kime, hangi sorun) → 3–5 öne çıkan özellik (kısa satırlar) → teknik bir ilginç ayrıntı → bağlantı + çağrı.
- Emoji en fazla madde başı işareti kadar; hashtag 3–6 adet, sonda.
- Görsel: kapak mockup'ı tek görsel ya da carousel (PDF) sırası `portfolyo.md`'de.
- Bağlantı ilk yorumda değil metinde; demo adresi çalışır durumda olmalı (Hobby kotası kontrol).

**LinkedIn görsel boyutları** (`mockup.mjs` bu varyantları da üretir; platform önerileri değişebilir, paylaşım öncesi kontrol edilir):

| Kullanım | Boyut | Oran |
|---|---|---|
| Tek görselli gönderi (önerilen) | 1080 × 1350 | 4:5 dikey, akışta en çok alan |
| Tek görselli gönderi (kare) | 1200 × 1200 | 1:1 |
| Bağlantı önizlemesi / OG | 1200 × 627 | 1.91:1 |
| Carousel (PDF belge) | 1080 × 1350 her sayfa | 4:5; 6–10 sayfa, ilk sayfa kapak mockup'ı |
| Portfolyo kapağı | 2560 × 1600 | 16:10 (kaynak; diğerleri bundan kırpılmaz, ayrı yerleşimle üretilir) |

## 7. Diğer yerler

| Yer | İçerik |
|---|---|
| README (depo) | Kapak mockup'ı, canlı demo bağlantısı, özellikler, teknoloji, kurulum, ekran görüntüsü ızgarası |
| Site alt bilgisi | "Created by Talha Keskin" imzası her sitede ([17 §3](17-icerik-ve-demo-verisi.md#3-kurgusal-kimlikler)) |
| Kişisel site / portfolyo kartı | Kapak + ≤ 160 karakter açıklama + etiketler |
| GitHub depo açıklaması | İngilizce, ≤ 350 karakter; konular (topics) |
| OG görseli | Demo sitesinin kendi OG görseli kapak mockup'ından türetilebilir |

## 8. Kontrol listesi

- [ ] `screenshot/` adlandırma kuralına uygun, en az liste tam
- [ ] `mockup/01-kapak.png` 2560 × 1600, masaüstü + telefon, farklı ekranlar
- [ ] `portfolyo.md` tüm bölümler dolu, her görselin başlık + açıklaması var
- [ ] Rakamlar ölçüm kaynaklı ve tarihli
- [ ] Görsellerde gerçek kişi verisi yok; görünen telefon yalnızca geliştiricinin hattı (`0542 311 58 88`), e-postalar `example.com`
- [ ] Panel görüntüleri `pnpm db:reset` sonrası: e2e artığı ("E2E Ziyaretçi" gibi) yok
- [ ] Demo adresi açık, `noindex` (demo), demo şeridi görünür
- [ ] README güncel

## 9. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| PO-01 | Ekran görüntüsü | Otomatik (Playwright), adlandırma sabit | Tekrarlanabilir; her sürümde yeniden üretilebilir. |
| PO-02 | Mockup | Kodla çizilen çerçeve | Lisans sorunu yok, projeye göre renk; referans kapak görselinin düzeni korunur. |
| PO-03 | Demo şeridi | Görüntülerde görünür | Kurgusal içeriğin dürüst sunumu. |
| PO-04 | Portfolyo planı | Proje başında (plan §21) | Ekranlar en başından vitrine göre tasarlanır **[+]**. |
| PO-05 | Hazırlık adımları ve yer tutucular | `ekranlar.json` içinde `hazirla`, yolda `{…}` | İskeletin ilk sürümü planın ışık kutusu, sihirbaz ve takip ekranlarını alamıyordu (Levha D-051). |

## 10. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-30 | v1.1 | Hazırlık adımları, panel oturumu ve yer tutucular (PO-05, D-051); alt bilgi imzası; kontrol listesinde telefon ve e2e artığı. |
