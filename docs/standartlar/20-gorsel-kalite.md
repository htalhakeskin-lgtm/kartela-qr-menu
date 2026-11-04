# Sanat Yönetimi ve Görsel Kalite

> **Durum:** v1.0 · **Son güncelleme:** 2026-10-23
> **Kararlar:** [Bölüm 9](#9-kararlar)

## 1. Bu belge ne işe yarar

Sitenin profesyonel görünmesini şansa bırakmaz, bir sürece bağlar: **konsept → referans → token → sahne kurgusu → görsel havuzu → görsel inceleme**. [06-arayuz](06-arayuz.md) tasarım sisteminin yapısını tanımlar. Bu belge kalite çıtasını ve o çıtaya ulaştıran adımları tanımlar.

Neden var: nail-art-studio (2026-10) projesinde testler, erişilebilirlik ve mobil kapılar yeşildi; buna rağmen site Revnak'ın gerisinde kaldı. Konsept tanımlanmamıştı, bu yüzden sektörün varsayılanı olan pembe pastel, degrade lekeler ve renkli kartlar geldi. Görseller tutarsız ve düşük çözünürlüklü stok fotoğraflardı. Revnak'ta ise "Sinematik lüks" adlı bir konsept, değerli token tablosu ve sahne sahne ana sayfa kurgusu her kararı yönlendirdi (Revnak plan §4, §6).

## 2. Süreç

| Faz | Adım | Çıktı |
|---|---|---|
| 1 Araştırma | **Görsel referans taraması:** sektörün üst segmentinden 6–8 site, en az ikisi yurt dışından. Her birinden "alınacak tek şey" not edilir. | `arastirma.md` §9 |
| 1 Araştırma | **Görsel havuzu ön taraması:** konsepte uygun fotoğraf bulunabiliyor mu? Stok kaynağında arama yapılıp 10 aday görülür. Bulunamıyorsa konsept değişir; konsept görsele göre kurulur, tersi değil. | `arastirma.md` §9 |
| 2 Plan | **İki konsept önerisi:** ad + üç cümle + palet + yazı tipi çifti + temsilî bir görsel. Onay özetinde kullanıcı seçer. | Onay özeti |
| 2 Plan | **Seçilen konseptin tam tanımı:** token tablosu (değerleriyle), tipografi ölçeği, ızgara, hareket kuralları, ana sayfa sahne sahne, görsel yönü, olmayacaklar. | Plan §11 |
| 3 Kurulum | **Stil karosu:** `/stil` sayfası (yalnızca demo / önizleme, `noindex`). Renkler, yazı ölçeği, düğmeler ve kart burada gösterilir; hero görseli seçilince bir hero örneği de eklenir. Tanımsız token taralı görünür. Ekran görüntüsü alınıp §7'deki inceleme yapılır. | D-01 dilimi |
| 3 Kurulum | **Görsel havuzu:** §5'e göre seçilmiş, kaydı tutulmuş görseller. | `docs/gorsel-kaynaklari.md` |
| 4 Geliştirme | Arayüze dokunan her dilimde **görsel inceleme turu** (§7). | `ilerleme.md` → Görsel inceleme |
| 5 Kalite | Görsel kalite kapısı + `gorsel-kalitesi.spec.ts` (§8). | Kalite raporu |

## 3. Konsept

Konsept, tasarımın tek cümlelik ölçütüdür. Her karar "Bu öğe {konsept adı} mı?" sorusuyla sınanır.

| Öğe | Kural |
|---|---|
| Ad | 2–3 kelime; bir his ve bir malzeme taşır: "Sinematik lüks" (Revnak), "Galeri beyazı", "Atölye sıcaklığı", "Sessiz klinik". |
| Tanım | Üç cümle: (1) zemin ve ışık, (2) renk disiplini ve vurgu, (3) fotoğraf ve hareket karakteri. |
| Olmayacaklar | En az beş madde; içinde sektör klişesi mutlaka bulunur (§3.1). |
| Referans panosu | 6–8 site; her birinden alınacak tek şey (tipografi ölçeği, boşluk, fotoğraf kırpımı, bölüm geçişi …). Rakipten metin ve görsel kopyalanmaz. |
| Seçenek | Onayda iki konsept sunulur. İkisi en az iki eksende ayrışır: açık / koyu, sıcak / soğuk, editoryal / samimi. |
| Gerçek müşteri | Logo ve kurumsal renk varsa konsept bunların üstüne kurulur. Instagram ızgarası markanın gerçek görsel dilidir; ışık, zemin ve renk karakteri oradan çıkarılır. |

**Konsept, sektör klişesinden en az bir eksende ayrışmak zorundadır.** Klişe bir başlangıç noktası olabilir ama sonuç olamaz.

### 3.1 Sektör klişeleri

| Sektör | Klişe (varsayılan, kaçınılır) | Yerine düşünülebilir |
|---|---|---|
| Güzellik / tırnak / kuaför | Şeker pembesi + pastel gökkuşağı, degrade leke, parıltı ✦, çiçek, kemer çerçeveli eğik foto kolajı | Kırık beyaz ya da koyu zemin, tek doygun vurgu (bordo, terrakota, siyah), büyük makro fotoğraf, editoryal yazı |
| Sağlık / diş | Mavi-beyaz, gülümseyen stok model, diş ikonu | Sıcak nötr + tek derin renk, gerçek mekân / ekipman, sakin büyük boşluk |
| Hukuk | Terazi, tokmak, lacivert + altın, kitaplık | Kırık beyaz + mürekkep siyahı, güçlü serif yazı, sade belge düzeni |
| Restoran | Kara tahta, el yazısı font, ahşap doku | Tabak fotoğrafı odaklı, yemek ışığına uygun koyu ya da kâğıt zemin |
| Emlak | Anahtar tutan el, el sıkışma, mavi gökyüzü | Mimari fotoğraf, koyu ya da taş tonu, harita ve veri |
| Spor | Neon yeşil, bağıran büyük harf, ter damlası | Siyah + tek canlı vurgu, hareket anı fotoğrafları, net ızgara |

## 4. Profesyonel görünüm çıtası

Her madde görsel inceleme turunda (§7) işaretlenir. Kod "GK" (görsel kalite) ile başlar ve inceleme raporunda bu numarayla anılır.

### 4.1 Görsel öncülük

| No | Kural |
|---|---|
| GK-01 | İlk ekranda **tek baskın görsel** vardır: tam genişlikte ya da ekranın en az yarısını kaplar. Bu kural **telefonda da** geçerlidir; telefonda ilk ekranda hiç görsel olmaması kusurdur. Küçük, eğik, kemer çerçeveli üçlü kolaj hero sayılmaz. |
| GK-02 | Görseller bir seri gibi durur: aynı zemin ailesi, benzer ışık yönü ve renk sıcaklığı. Bir sayfada en fazla bir "aykırı" görsel bulunur. |
| GK-03 | Bir görsel sitede tek bir rolde kullanılır. Hero görseli galeri kartında ya da stil çipinde tekrar edilmez. Galerinin kendi sayfası bu kuralın dışındadır. |
| GK-04 | Keskinlik: dosyanın gerçek piksel boyutu, kapladığı ekran pikselinin (gösterim × min(DPR, 2)) en az %80'idir; yani görsel en fazla 1,25 kat büyütülür. 1440 px genişliğinde, 2 kat yoğunluklu ekranda tam genişlik görsel için 2400 px yeter (1,2 kat). Bulanık görsel öznel bir yargı değildir; `gorsel-kalitesi.spec.ts` bunu ölçer. |

### 4.2 Renk ve yüzey

| No | Kural |
|---|---|
| GK-05 | Tek hâkim renk + nötrler; vurgu ekranın en fazla %10'u. Bölümleri ya da kartları farklı pastel tonlarla renk kodlamak yasaktır (altı hizmet = altı renk değil). |
| GK-06 | Degrade leke (bulanık daireler), parıltı / yıldız süsleri, cam efekti, renkli parlak gölge kullanılmaz. Konsept açıkça istiyorsa yalnızca tek bir yerde kullanılır ve planda yazılıdır. |
| GK-07 | Her bölüm bir kartın içinde durmaz. Kart yalnızca tekrar eden öğe içindir (hizmet, ilan, yorum). Bölümler zemin değişimi, ince çizgi ve boşlukla ayrılır. |

### 4.3 Tipografi

| No | Kural |
|---|---|
| GK-08 | Ölçek kontrastı belirgindir. Hero başlığı masaüstünde en az 56 px (konsepte göre 64–96 px), gövde 16–18 px, arada en az dört kademe vardır. Üst başlık (eyebrow) küçük ve harf aralıklıdır. |
| GK-09 | Vurgu tek araçla yapılır. İtalik ya da renkli "vurgu kelimesi" sitede en fazla bir kez kullanılır. |
| GK-10 | Gövde satırı 60–75 karakterdir. Ortalanmış uzun paragraf (üç satırdan uzun) kullanılmaz. |

### 4.4 Yerleşim ve ritim

| No | Kural |
|---|---|
| GK-11 | Bölüm düzenleri çeşitlidir. Arka arkaya iki bölüm aynı düzende olmaz (ör. ortalı başlık + kart ızgarası, ardından yine ortalı başlık + kart ızgarası). Tam genişlik görsel bant, asimetrik iki sütun, ızgara ve liste dönüşümlü kullanılır. |
| GK-12 | Dikey ritim token'dan gelir. Bölüm aralığı tek bir değerdir; "boş kalmış" görünen 200 px'ten büyük boşluk olmaz. |
| GK-13 | İçerik genişliği en fazla üç kalıptan biridir: metin, içerik, tam genişlik. |

### 4.5 Eylem disiplini

| No | Kural |
|---|---|
| GK-14 | İlk ekranda bir birincil ve en fazla bir ikincil eylem bulunur. Telefonda mobil eylem çubuğu varsa hero'da tek düğme kalır; çubuğun eylemleri hero'da alt alta tekrarlanmaz. |
| GK-15 | İkincil düğme açıkça okunur: çerçeveli ya da yalnızca metin. Devre dışı gibi görünen soluk gri ya da pembe-gri dolgu kullanılmaz. Çerçeve kontrastı ≥ 3:1, metin kontrastı ≥ 4.5:1. |

### 4.6 İçerik ve dürüstlük

| No | Kural |
|---|---|
| GK-16 | Demo notu üç yerde toplanır: üst şerit, alt bilgi ve yasal metinler ([17 §3](17-icerik-ve-demo-verisi.md#3-kurgusal-kimlikler)). Sayfa içine "(örnek adres)", "örnek numara", her görselin altına "temsilîdir" serpiştirilmez. Kurgusal belge ya da sertifika numarası hiç gösterilmez; alan demo'da gizlenir. "Örnek yorum" ibaresi yorum bölümünün başlığında bir kez yazılır. |
| GK-17 | Yer tutucu hissi veren öğe olmaz: harf avatarlı birbirinin aynısı yorum kartları, ikonlu üçlü "neden biz" kartları, içi boş istatistik bandı. |

### 4.7 Hareket ve ayrıntı

| No | Kural |
|---|---|
| GK-18 | Bir ekranda en fazla bir büyük efekt olur (Revnak §4.5 kural 6). Bütün etkileşimli öğelerin hover ve odak durumları tasarlanmıştır. |
| GK-19 | Kaydırma çubuğu görünen yatay şerit olmaz. Yorumlar ızgarada ya da oklu kaydırıcıda gösterilir; kaydırma çubuğu gizlenir. |
| GK-20 | Favicon, OG görseli, 404 sayfası ve boş durumlar da konseptin dilinde tasarlanır. |

## 5. Görsel araştırma ve seçim

### 5.1 Kaynak önceliği

1. **Müşterinin kendi işleri** (gerçek müşteri). **Orijinal dosyalar** istenir: Instagram görselleri en fazla 1080 px'tir ve sıkıştırılmıştır. Bu yüzden Instagram'dan indirilen görsel hero'da ya da tam genişlikte kullanılmaz; en çok kart ve galeri boyutunda kullanılır. Kullanım izni yazılı alınır. İyi fotoğraf yoksa plan §14'te kısa bir çekim önerilir.
2. **Stok:** Unsplash ve Pexels (ticari kullanıma açık lisans), görsel kaynağın kendi CDN'inden sunulur (§6). Aynı fotoğrafçının ya da aynı çekimin serisi tercih edilir; tutarlılık buradan gelir.
3. **Yapay zekâ ile üretim:** yalnızca stokta bulunmayan bir sahne için kullanılır. El, parmak, tırnak, yazı ve logo içeren görsel üretilmez; zorunluysa %100 yakınlaştırmada denetlenir (fazla ya da eksik parmak, eriyen kenar). "Temsilîdir" kaydı tutulur.

### 5.2 Arama yöntemi

- Sorgular İngilizce ve stil kelimeli yazılır: konu + ışık + zemin + çekim mesafesi. Örnekler: `manicure close-up neutral background natural light`, `minimal nail art beige backdrop editorial`, `hands holding coffee soft window light`.
- Her ihtiyaç için **üç kat aday** toplanır: 12 görsel gerekiyorsa 36 aday. Adaylar `docs/tasarim/adaylar/` altına iner; bu klasör `.gitignore`'dadır.
- **Temas sayfası:** `pnpm gorsel:kontrol docs/tasarim/adaylar` bütün adayları boyutlarıyla tek bir ızgara görüntüsünde toplar. Ajan bu görüntüyü açar ve **bakarak** seçer. Görselleri tek tek değerlendirmek yetmez; seri tutarlılığı ancak yan yana görünür.

### 5.3 Kabul ölçütleri

| Ölçüt | Eşik |
|---|---|
| Kaynak çözünürlüğü | Hero / tam genişlik: uzun kenar ≥ 2400 px · Kart / galeri: ≥ 1600 px · Küçük gösterim (≤ 200 px): ≥ 800 px |
| Keskinlik | %100 yakınlaştırmada odak noktası net; sıkıştırma bloğu ve gürültü yok |
| Konu | Sektöre ve konsepte uygun. İşletmenin yapmadığı bir hizmeti göstermez (stüdyo protez tırnak yapmıyorsa stiletto protez fotoğrafı yok). |
| Seri tutarlılığı | Zemin ailesi, ışık yönü ve sertliği, renk sıcaklığı benzer; temas sayfasında aykırı görsel yok |
| Kompozisyon | Kırpma payı var; üstüne metin gelecekse sakin bir alan var; ana konu kenarda kesilmiyor |
| Renk | Konseptin paletiyle çatışmıyor (nötr bir konseptte neon ve aşırı doygun görsel yok) |
| Lisans ve hukuk | Ticari kullanıma açık; tanınır yüz varsa model izni var; marka ve logo görünmüyor |

**Ret nedenleri:** filigran, ekran görüntüsü, kolaj, ağır filtre, yapay zekâ artefaktı, hero'da 1080 px Instagram kopyası.

### 5.4 Kayıt

`docs/gorsel-kaynaklari.md` tablosunun sütunları: dosya · rol (hero / kart / galeri / küçük) · kaynak adresi · fotoğrafçı · lisans · orijinal boyut · not. Kaydı olmayan görsel kullanılmaz ([17 §5](17-icerik-ve-demo-verisi.md#5-görseller)).

## 6. Görsel teslimi

| Durum | Yöntem |
|---|---|
| Stok görsel | Depoya indirilmez. `next/image` özel loader ile kaynağın CDN'inden istenen genişlik gelir: Unsplash `images.unsplash.com/…?w={w}&q={q}&auto=format&fit=crop`, Pexels `images.pexels.com/…?auto=compress&cs=tinysrgb&w={w}`. Her genişlik vardır ve Vercel kotası harcanmaz (Revnak K12). |
| Yerel dosya (müşteri görseli, kendi çekim) | Canlıda `next/image` optimizasyonu kullanılır. Demo'da kota sorun olursa derleme anında `sharp` ile 640 / 960 / 1280 / 1920 / 2560 türevleri üretilir. `srcset`'teki `w` tanımlayıcısı dosyanın **gerçek** genişliğidir. |
| Yasak | Elle yazılmış `srcset`. nail-art-studio'da `1600w` etiketli dosya 1064 px, `320w` etiketli dosya 480 px'ti; tarayıcı yanlış dosyayı seçti ve görseller bulanık göründü. |
| `sizes` | Yerleşimden hesaplanır ve her kırılım için güncellenir. Yanlış `sizes` değeri GK-04 testinde yakalanır. |
| Kalite | `quality` 75 (hero 85); AVIF / WebP. LCP görseli `priority`. Telefonda hero görseli ilk ekranda görünür (GK-01). |

## 7. Görsel inceleme turu

Arayüze dokunan her dilimin "Doğrula" adımında ve Faz 5'te yapılır. `/web-proje tasarim` modu bu turu tüm siteye uygular.

1. **Görüntü al:** değişen sayfaların 1440 × 900 ve 390 × 844 tam sayfa ekran görüntüsü (`pnpm screenshots` ya da dilime özel Playwright çekimi).
2. **Bak:** ajan görüntüleri açar ve inceler. Kodu okuyarak "tasarım tamam" denmez.
3. **Çıta:** §4'teki GK maddeleri tek tek işaretlenir ve konsept adıyla sınanır ("Bu bölüm Galeri beyazı mı?").
4. **Kıyas:** referans panosundan iki site ile yan yana karşılaştırılır. "Bu bölüm referansın yanında amatör kalıyor mu, neden?" sorusu tipografi ölçeği, boşluk, görsel kalitesi ve renk sayısı üzerinden yanıtlanır.
5. **Beş saniye testi:** yalnızca ilk ekran görüntüsüne bakılarak işletmenin ne olduğu, nerede olduğu, birincil eylemin ne olduğu ve sitenin "seçkin" görünüp görünmediği yanıtlanır.
6. **Kayıt:** bulgular `docs/ilerleme.md` → "Görsel inceleme" tablosuna yazılır. Kırmızı bulgu dilimi kapatmaz.

## 8. Otomatik denetimler

| Araç | Ne denetler |
|---|---|
| `tests/e2e/gorsel-kalitesi.spec.ts` ([iskelet](../iskelet/tests/e2e/gorsel-kalitesi.spec.ts)) | 1440 px @2x ve 390 px @3x'te her rotada: dosyanın gerçek pikseli ≥ gösterim × min(DPR, 2) × 0,8 (GK-04; `srcset`'in yoğunluk düzeltmesi hesaba katılmaz, dosya ayrıca ölçülür); kırık görsel yok; aynı görsel dosyası sayfada birden fazla rolde değil (GK-03, galeri rotaları hariç) |
| `pnpm gorsel:kontrol <klasör>` ([iskelet](../iskelet/scripts/gorsel/temas-sayfasi.mjs)) | Aday ya da `public/` görsellerinin boyut raporu, eşik altı işaretleme ve temas sayfası (`docs/tasarim/temas-sayfasi.png`) |
| Lighthouse CI ([12 §8](12-performans.md#8-ölçüm-araçları)) | Performans, erişilebilirlik, en iyi uygulamalar; LCP görselinin boyutu |

## 9. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| SY-01 | Konsept | S1 dahil her projede zorunlu; adlı ve tanımlı | nail-art-studio'da konsept yokluğu sektörün pastel varsayılanını üretti. Revnak'ın "Sinematik lüks" tanımı her kararı yönlendirdi. **[+]** |
| SY-02 | Seçenek | Onayda iki konsept sunulur | Zevk tek bir öneriyle değil seçimle ölçülür; yanlış yön kod yazılmadan düzeltilir. |
| SY-03 | İnceleme | Ekran görüntüsüne bakılarak yapılır | Kod okumak görünümü doğrulamaz; nail-art-studio'da bütün kapılar yeşilken görünüm zayıftı. |
| SY-04 | Keskinlik | Ölçülebilir eşik + e2e testi | "Görseller kalitesiz" şikâyetinin teknik yarısı (yanlış `srcset` / `sizes`) otomatik yakalanır. |
| SY-05 | Demo notu | Üç yerde toplanır | Dürüstlük korunur; sayfa içine serpiştirilmiş "örnek" ibareleri profesyonel görünümü bozuyordu. [17 §3](17-icerik-ve-demo-verisi.md#3-kurgusal-kimlikler) bu kararla daraltıldı. |
| SY-06 | Stok görsel | Depoya indirilmez, CDN'den sunulur | İstenen her genişlik vardır; kota harcanmaz; elle türev üretme hatası ortadan kalkar. |
| SY-07 | Aday sayısı | İhtiyacın üç katı + temas sayfası | Tutarlı seri ancak yeterli aday havuzundan ve yan yana bakılarak seçilir. |

## 10. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-23 | v1.0 | İlk sürüm (nail-art-studio dersleri ve Revnak tasarım sistemi karşılaştırmasından). |
