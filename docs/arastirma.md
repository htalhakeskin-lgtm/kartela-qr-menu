# Araştırma Özeti — Kartela: Çok Mekânlı QR Menü Platformu

> **Tarih:** 2026-11-04 · **Sektör modülü:** `katalog/sektorler/restoran-otel.md` (QR menü platformu için yeterli değil; projeye özgü `QR-` özellikleri tanımlandı, Faz 8'de yeni sektör modülü olarak önerilecek)

## 0. Brif

| Alan | Bilgi |
|---|---|
| Konu | "Çok mekânlı QR menü platformu: ortak altyapı + yönetim paneli + referans tema + ilk mekân (kahveci). DEMO / portfolyo projesi." (ayrıntılı brif kullanıcı mesajında) |
| İşletme tipi | Yazılım platformu. Kiracılar: kafe, restoran, bar türü mekânlar (16 hedef tür). Bu projede: kahveci (özel tema) + deneme mekânı (hazır tema) |
| Bölge | İstanbul. Kahveci: Moda, Kadıköy. Deneme mekânı: Sirkeci / Eminönü (turist yoğun, Arapça ihtiyacı gerçekçi) |
| Dil | Türkçe varsayılan. Mekân başına ek diller: Rakım TR + EN; deneme mekânı TR + EN + AR (sağdan sola düzen kanıtı) |
| Demo mu, gerçek müşteri mi | Demo / portfolyo. Mekânlar, kişiler, fiyatlar kurgusal |
| Bilinen kısıtlar | Vercel Hobby; ziyaretçi hesabı, sipariş ve ödeme yok; menü sayfalarında Lighthouse mobil ≥ 95; QR'dan sonra ilk ürün 4G'de ≤ 1,5 sn; tema paketleri birbirine karışmaz |
| Sorulan sorular ve cevaplar | Soru sorulmadı. Brif sabit kararları verdi; kalan belirsizlikler plan §22'de açık soru (Q-01…Q-05) |
| Varsayımlar | Platform adı "Kartela" (çalışma adı), kahveci "Rakım Kahve Kavurma", deneme mekânı "Kepçe Esnaf Lokantası"; alan adları `*.vercel.app` (uygunluğa göre); ayrıntı plan §4 |

## 1. Sektör ve rakip analizi

| Platform | Öne çıkan özellik | İyi uygulama | Boşluk |
|---|---|---|---|
| [FineDine](https://www.finedinemenu.com/blog/understanding-food-allergies-implications-for-your-restaurant-challenges-and-solutions) | 14 alerjen takibi ve ziyaretçinin alerjene göre süzmesi, çok dil ([liste](https://listicler.com/tools/finedine)) | Alerjen tablosunu filtreye çeviriyor | Şablon görünüm; bütün mekânlar aynı arayüzde, marka yalnızca logo ve renk |
| [doXmenu](https://www.doxmenu.com/qr-menu/turkey/) · [karşılaştırma](https://www.doxmenu.com/compare/doxmenu-vs-finedine/) | Türkiye'de "karekod menü"; garson çağır düğmesi | Masadan garson çağırma | Görsel dil jenerik; içerik anlatımı (hikâye, köken) yok |
| [MENU TIGER](https://www.menutiger.com/tr/features/qrcode-menu-restaurants) | Çok dilli menü, alerjen, anlık dil değişimi | Dil değişimi tek dokunuş | Sipariş akışına odaklı; menü okuma deneyimi ikinci planda |
| [Menulux](https://app.menulux.com/en/blog/cafe-menu-design-customer-satisfaction-with-digital-menu-and-qr-code) | Türk pazarı, kafe odaklı içerik | Kafe menüsünde kategori sırası önerileri | Tema yok; kafeler birbirinin aynısı |
| Kahve kavurucu siteleri ([Caravan](https://ecomm.design/site/caravan/), [kavurucu şablonu](https://www.framer.com/marketplace/templates/coffee-roastery-site/)) | Köken, işleme, rakım, tadım notu yapılandırılmış alan | Çekirdek verisinin ikon / satır olarak dizilmesi, tadım notuna göre süzme | QR menüyle bağlantısı yok; masada okunacak biçimde değil |

**Ortak beklentiler (B ölçütü):** fotoğraflı kategori listesi, fiyat, alerjen / diyet etiketi, dil seçimi, tükendi işareti, hızlı açılış. Rakiplerin hepsinde var; yokluğu göze batar.

**Boşluklar (fark yaratma fırsatı):**
- **Mekâna özgü görsel kimlik.** İncelenen platformların hepsi tek şablona logo ve renk giydiriyor. "Tek altyapı, N farklı deneyim" bu boşluğu hedefler.
- **Anlatım katmanı (Keşfet).** Ürün hikâyesi, tedarikçi, köken ve demleme rehberi menüde yok; kavurucu sitelerinde var ama masada kullanılamıyor.
- **Ürün kurucu ve canlı fiyat.** Kahve özelleştirmede seçimle değişen fiyat yalnızca sipariş uygulamalarında var; siparişsiz menüde "ne ödeyeceğimi bileyim" ihtiyacı karşılanmıyor.
- **Mevzuat çıktıları.** Kapı önü fiyat listesi ve talep hâlinde verilecek basılı liste aynı veriden üretilmiyor; işletme bunları elle tutuyor.
- **Çevrimdışı açılış ve hız.** Bodrum katlarda ve kalabalık mekânlarda zayıf bağlantıda menünün açılması nadiren ele alınıyor.

## 2. Hedef kitle ve karar yolculuğu

| Aşama | Ziyaretçinin sorusu | Sitenin cevabı |
|---|---|---|
| QR okutma (masada) | "Ne var, ne kadar?" | İlk ekran menü; ilk ürün adı ve fiyatı ilk boyamada görünür |
| Değerlendirme | "Bana uygun mu? (alerji, vegan, acı) · Bu kahve neye benziyor?" | Filtreler, alerjen ve bileşen bilgisi, çekirdek kartı, tadım notu |
| Karar | "Bu seçimle kaça gelir? Garsona ne diyeceğim?" | Ürün kurucu (canlı fiyat), Seçtiklerim listesi ve "garsona göster" tam ekran görünümü |
| Merak | "Bu kahve nereden geliyor, nasıl demleniyor?" | Keşfet görünümü: köken, demleme rehberi, ürün hikâyeleri |
| Sonrası | "Evde de demlemek istiyorum" | Çekirdek kartında 250 g paket fiyatı ve demleme önerisi |

Yabancı ziyaretçi (deneme mekânı): "Bu yemek ne, içinde ne var?" → çeviri, bileşen, alerjen; Arapça sağdan sola.

## 3. Ağrı noktaları ve fırsatlar

| Kimin | Ağrı noktası | Özellik fikri |
|---|---|---|
| Ziyaretçi | QR menü yavaş açılıyor, PDF menü telefonda okunmuyor | Statik HTML menü, PDF yok; ilk ürün ≤ 1,5 sn |
| Ziyaretçi | Loş mekânda beyaz ekran göz alıyor | Tema başına koyu / akşam token takımı, saate göre geçiş |
| Ziyaretçi | Garsona uzun ürün adı ve özelleştirme anlatmak zor | Seçtiklerim + "garsona göster" büyük yazılı ekran |
| Ziyaretçi | Alerji sorusunu garson bilmiyor | 14 alerjen + bileşen listesi her üründe, alerjenle dışlama filtresi |
| İşletme | Fiyat değişince basılı menü, kapı listesi ve QR menü ayrı ayrı güncelleniyor | Tek veri; baskılar ve QR menü aynı kaynaktan |
| İşletme | Yoğun saatte "tükendi" işaretlemek için bilgisayara gitmek | Telefonda tek dokunuş müsaitlik ekranı |
| İşletme | Enflasyonda sık toplu zam | Kategori bazında yüzde / tutar + yuvarlama + geri alma |
| İşletme | Hangi masada ne aranıyor, neye bakılıyor bilinmiyor | Çerezsiz istatistik, sonuç vermeyen aramalar |
| Platform | Her yeni mekân sıfırdan site | Tema sözleşmesi + `pnpm mekan:yeni`; hazır temayla 1 iş günü |

## 4. İşletme sahibinin iş akışı

- **Kim, ne sıklıkla, hangi cihazdan:** Personel vardiya boyunca telefondan (tükendi, günlük adet, günün menüsü); yönetici haftada birkaç kez masaüstünden (ürün, fiyat, hikâye); sahip ayda bir (toplu fiyat, istatistik, ekip). Platform yöneticisi (geliştirici) mekân açarken.
- **Günlük işler:** tükendi / adet güncelleme (en sık), günün menüsünü seçme (esnaf lokantası), fırından çıkış saatleri, fiyat güncelleme.
- **CRM gereksinimi (K7):** Ziyaretçi talep bırakmıyor, satış süreci yok → **CRM uygulanmaz**; talep kutusu da yok (ziyaretçi formu yok).

## 5. Yasal ve düzenleyici gereklilikler

| Konu | Gereklilik | Kaynak (tarihli) | Sitede karşılığı |
|---|---|---|---|
| Fiyat Etiketi — karekod | Masadaki fiyat listesi karekodla gösterilebilir; tüketici isterse fiziki liste verilir | 11.10.2025 tarihli, 33044 sayılı RG değişikliği ([özet](https://ozay.av.tr/publication/fiyat-etiketi-yonetmeligi-nde-yapilan-onemli-degisiklikler); [Bakanlık](https://ticaret.gov.tr/haberler/fiyat-etiketinde-yeni-donem-basliyor)) | Menüde "Basılı fiyat listesini isteyebilirsiniz" notu; panelden yazdırılabilir masa listesi |
| Fiyat Etiketi — kapı önü | Her giriş kapısında fiyat listesi | Aynı değişiklik | Kapı önü listesi aynı veriden A4 / A3 baskı |
| Fiyat Etiketi — tüm ürünler | Sunulan bütün ürünler listede; eksik her ürün ayrı aykırılık | Aynı değişiklik | Kapı / basılı liste yayındaki bütün ürünleri içerir (gizli bölüm dahil, BR-YSL-003) |
| Fiyat Etiketi — Bakanlık sistemi | Kriterleri belirlenen yeme-içme işletmeleri fiyat listelerini Bakanlığın sistemine aktarır; usul ve esasların ilanından sonra 3 ay | Aynı değişiklik ([AA](https://www.aa.com.tr/tr/ekonomi/isletmelere-fiyat-bilgisi-paylasim-zorunlulugu-getirildi/3714178)) | **Usul ve esaslar 2026-11-04 itibarıyla bulunamadı.** Veri modeli dışa aktarmaya hazır; aktarım P2 |
| Servis / kuver ücreti | Lokanta, kafe, restoran, pastane ve benzeri işletmeler servis, masa, kuver ya da benzeri adla ilave ücret **alamaz**; menüde bu tür ücrete yer verilemez; istenmeden sunulan kuver ürünü ücretlendirilemez. İş Kanunu md. 51 saklı | 30.01.2026 tarihli, 33153 sayılı RG ([metin özeti](https://www.alomaliye.com/2026/01/30/fiyat-etiketi-yonetmeliginde-degisiklik-30-01-2026/); [Bakanlık](https://ticaret.gov.tr/haberler/ticaret-bakanligi-tarafindan-fiyat-etiketi-yonetmeliginde-degisiklik-yapildi); [AA](https://www.aa.com.tr/tr/ekonomi/ticaret-bakanligindan-fiyat-etiketi-yonetmeligindeki-degisiklige-iliskin-aciklama/3814937)) | **Brifle çelişiyor** ("servis ücreti gösterilir"). Platform yeme-içme mekânında bu kalemleri engeller (BR-YSL-001), menüde "Servis, masa ya da kuver ücreti alınmaz" yazar (Q-01) |
| KDV gösterimi | Fiyatlar KDV dahil gösterilir | Fiyat Etiketi Yön. (RG 29044, 28.06.2014) | "Fiyatlara KDV dahildir" her dilde |
| Alerjen | Toplu tüketim yerlerinde 1.1.2020'den beri Ek-1'deki 14 alerjen son tüketiciye bildirilir (menü, pano, yazı tahtası) | TGK Gıda Etiketleme ve Tüketicileri Bilgilendirme Yön., RG 29960 (26.01.2017) ([metin](https://isparta.tarimorman.gov.tr/BelgelerArsiv/Haber/2019/G%C4%B1da%20Etiketleme%20Y%C3%B6netmeli%C4%9Fi%20Bilgilendirme%20Toplant%C4%B1s%C4%B1%20D%C3%BCzenlendi/T%C3%BCrk%20G%C4%B1da%20Kodeksi%20G%C4%B1da%20Etiketleme%20ve%20T%C3%BCketicileri%20Bilgilendirme%20Y%C3%B6netmeli%C4%9Fi.pdf); [il müdürlüğü notu](https://ordu.tarimorman.gov.tr/BelgelerArsiv/G%C4%B1da%20ve%20Yem/GIDA%20%C3%9CRET%C4%B0M%20%C4%B0%C5%9ELETMEC%C4%B0LER%C4%B0N%C4%B0N%20ET%C4%B0KETLEMEDEK%C4%B0%20SORUMLULUKLARI.pdf)) | 14 alerjen sabit kümesi; her üründe ve filtrede; menü altında genel alerjen beyanı |
| Bileşen ve enerji (kalori) | 2026 kılavuz revizyonu: toplu tüketimde bileşen ve enerji bildirimi zorunlu; menü, pano, dijital ekran **ya da karekod** ile; karekod kullanamayan tüketiciye ayrıca ulaştırılır. Takvim: ulusal zincirler 01.07.2026; diğerleri bileşen 31.12.2026, enerji 31.12.2027 | [Bakanlık duyurusu](https://www.tarimorman.gov.tr/GKGM/Duyuru/681/Tgk-Gida-Etiketleme-Ve-Tuketicileri-Bilgilendirme-Yonetmeligi-Kilavuzu-Guncellendi); [İstanbul İl Md.](https://istanbul.tarimorman.gov.tr/Sayfalar/Detay.aspx?OgeId=465&Liste=Duyuru); [Güvenilir Gıda](https://guvenilirgida.tarimorman.gov.tr/Haber/Detay/18459) | **Brif "isteğe bağlı" diyor; 2027 sonunda zorunlu.** Bileşen ve enerji ürün modelinde birinci sınıf alan; panelde eksik raporu; basılı listeye de girer (Q-04) |
| Alkollü içki | Açık alkollü içki satan yerde menüde marka, servis / ambalaj hacmi ve fiyat; satıştaki bütün alkollü içkiler menüde; reklamda alkolü yemeğin vazgeçilmez tamamlayıcısı gibi gösterme yasağı | TAPDK yönetmeliği; yalnızca ikincil kaynaklardan görüldü ([4250 cezalar](https://tarimorman.gov.tr/TADAB/Belgeler/%C4%B0dari%20Yapt%C4%B1r%C4%B1mlar/2014%20%C4%B0dari%20Para%20Cezalar%C4%B1/2014-4250.pdf), haberler) | **Güncel resmî metinle doğrulanamadı → açık soru.** Bu projenin iki mekânında alkol yok; motor `alcohol` bayrağı, marka, hacim (cl), 18 yaş notu ve "alkol eşleşmesini göster" anahtarını (varsayılan kapalı) taşır. Bar / meyhane dilimi açılırken resmî metin okunur |
| KVKK | Ziyaretçiden kişisel veri alınmaz; istatistik çerezsiz ve IP saklamadan; Seçtiklerim yalnızca tarayıcıda | KVKK; KVKK Çerez Rehberi (zorunlu / işlevsel saklama) | Mekân sitesinde form yok → aydınlatma gerektiren akış yok. Panel kullanıcıları için aydınlatma metni; çerez politikasında localStorage açıklaması |
| Vercel Hobby | Yalnızca ticari olmayan kişisel kullanım; proje başına 50 alan adı; ayda 5.000 görsel dönüşümü **ekip (hesap) geneli**; aşımda yeni görsel 402 döner | [Limits](https://vercel.com/docs/limits) (güncelleme 2026-09-16), [Image Optimization](https://vercel.com/docs/image-optimization/limits-and-pricing) (2026-08-11) | Demo Hobby'de; gerçek mekân Pro. Görseller kaynağın CDN'inden (Vercel kotası harcanmaz). **Not:** kota proje değil hesap başına; mekân başına ayrı proje kotayı artırmaz |

**Doğrulanamayanlar (açık soru):** TAPDK alkol menü / tanıtım hükümlerinin güncel resmî metni; otel oda servisinin servis ücreti yasağına girip girmediği ve İş Kanunu md. 51 istisnasının kapsamı; Bakanlık fiyat aktarım sisteminin usul ve esasları.

## 6. SEO fırsatları

Mekân siteleri birbirinden bağımsızdır; platform tanıtım sayfası kendi başına bir vaka çalışmasıdır.

| Arama niyeti | Örnek sorgular | Sayfa / içerik | Schema |
|---|---|---|---|
| Yerel mekân | "moda üçüncü dalga kahve", "kadıköy filtre kahve" | Mekân ana menü sayfası (indekslenebilir HTML, PDF değil) | `CafeOrCoffeeShop` / `Restaurant` + `hasMenu` |
| Menü | "rakım kahve menü", "sirkeci esnaf lokantası menü fiyat" | Hızlı menü | `Menu`, `MenuSection`, `MenuItem` (+ `offers`, `suitableForDiet`) |
| Bilgi | "v60 demleme oranı", "etiyopya guji tadım notu" | Keşfet: demleme rehberi, çekirdek kökeni | `Article` / `HowTo` (demleme) |
| Turist (deneme mekânı) | "sirkeci lokanta", "halal homestyle food eminönü" (EN), Arapça | Dil başına URL + `hreflang` | `Restaurant` + dil alternatifleri |

Yerel SEO: Google İşletme Profili gerçek mekânda; demo'da `noindex`. Canlıda her mekânın kendi alan adı, `metadataBase`, `sitemap.xml` ve `robots.txt`'si; mekânlar birbirine bağlantı vermez.

## 7. Hesap modeli kararı

Karar mantığı §4: (1) Ziyaretçi büyüyen kişisel veriyi tekrar görmüyor → hayır. (2) Tekrar gelen ziyaretçiye hesap somut kazanç sağlamıyor (Seçtiklerim tarayıcıda yeterli) → hayır. (3) Ziyaretçi işlem yapmıyor (sipariş yok) → hayır. → **Model A: Hesapsız.** Panel: çok rollü personel girişi (platform yöneticisi, sahip, yönetici, personel). İleride "garson çağır" ve "masadan sipariş" gelince model B'ye (misafir işlem) geçilir; veri modeli buna açık.

## 8. Özellik adayları

| Kaynak | Aday | Not |
|---|---|---|
| Çekirdek | Tamamı; Z-09, Z-13, Z-15, Z-29 uyarlanır ya da uygulanmaz | Ziyaretçi formu yok (plan §5) |
| Katalog | A-01 roller, A-02 işlem geçmişi, A-03 2FA, A-06 pano, A-07 rapor, A-13 medya, A-15 içe aktarma, A-28 SEO | S4 panel seti |
| Sektör modülü | X-RST-01 dijital menü, -02 alerjen / diyet filtresi, -03 masa QR menüsü, -17 menü / fiyat listesi PDF | Rezervasyon, sipariş, oda, sadakat kapsam dışı (P2) |
| Araştırma | QR-01…QR-36 (plan §5): kiracı yönlendirme, menü motoru, tema sözleşmesi, Keşfet, ürün kurucu, mevzuat baskıları, çerezsiz istatistik, çevrimdışı açılış, `mekan:yeni` | Katalogda karşılığı yok; Faz 8'de `qr-menu-platformu` sektör modülü önerilir |

## 9. Görsel referanslar ve görsel havuzu

**Referans panosu** (Rakım için; Faz 3'te `/browse` ile ekran görüntüleri `docs/tasarim/referanslar/` altına alınır):

| Site | Neden iyi | Alınacak tek şey |
|---|---|---|
| [La Cabra](https://lacabra.dk) (Danimarka) | İskandinav sadeliği, açık zemin, büyük ürün fotoğrafı | Ürün fotoğrafının açık zeminde tek başına durması, bol boşluk |
| [Onyx Coffee Lab](https://onyxcoffeelab.com) (ABD) | Kahve başına yoğun veri | Kavurma derecesi, köken, işleme verisinin satır satır dizilişi |
| [Coffee Collective](https://coffeecollective.dk) (Danimarka) | Köken şeffaflığı | Üretici ve çiftlik anlatımının ürünle bağlanması |
| [Tim Wendelboe](https://timwendelboe.no) (Norveç) | Aşırı sade, metin odaklı | Az renk, net tipografik hiyerarşi |
| [Kurasu Kyoto](https://kurasu.kyoto) (Japonya) | Editoryal ızgara, demleme ekipmanı fotoğrafları | Demleme rehberinin adım adım görsel dizisi |
| [Blue Bottle](https://bluebottlecoffee.com) (ABD) | Tutarlı fotoğraf serisi | Bütün ürünlerde aynı ışık ve kırpım |
| [Kronotrop](https://kronotrop.com.tr) (İstanbul) | Yerel üçüncü dalga | Türkçe kahve terminolojisi ve ton |
| [Caravan](https://ecomm.design/site/caravan/) (Birleşik Krallık) | Köken / işleme / tadım notu ikon satırı | Çekirdek kartında veri satırı düzeni |

**Sektör klişesi** (kaçınılacak): kara tahta, el yazısı font, ahşap doku, kraft kâğıt, kahve çekirdeği deseni ya da ikon dizisi, her yerde kalp latte art, kahverengi tek ton palet, "dark moody" stok fotoğrafı, buhar efekti.

**Konsept adayları** (onayda ikisi sunulur):

| Konsept | Üç cümle | Palet | Yazı çifti | Görsel bulunabilirliği |
|---|---|---|---|---|
| **A. Demleme Defteri** (önerilen) | Zemin gün ışığı alan kırık beyaz kâğıt, metin grafit; ekran barda açık duran bir demleme defteri gibi okunur. Tek vurgu kavurma turuncusu yalnızca canlı fiyat, etkin saat ve seçili çipte; rakım, oran, sıcaklık, gram tablo rakamlı monospace ile veri gibi dizilir. Fotoğraflar açık taş / beyaz zeminde yandan pencere ışığıyla, keskin gölgeli tepeden çekimler; hareket kısa ve ölçülü, fiyat değişince yalnızca rakam kayar. | kâğıt `#F3F1EC` · yüzey `#FBFAF7` · mürekkep `#1F1D1A` · soluk `#5E5A54` · çizgi `#DAD5CC` · vurgu `#B4441B` (kâğıtta 4,9:1) | Schibsted Grotesk (başlık + gövde) + IBM Plex Mono (veri) | Unsplash ilk tarama: 10 adayın 7'si aynı seri karakterinde (beyaz / açık gri zemin, gün ışığı), hepsi ≥ 2442 px. Temsilî: [Nicolas Solerieu — beyaz masada çekirdekler](https://unsplash.com/photos/GSnb5l2yc2M) `images.unsplash.com/photo-1613179848952-27cb5aac1e6e` (4896 × 3139) |
| **B. Kehribar Gece** | Kavrulmuş koyu zemin, krem metin; ekran loş bir espresso barının tezgâhı gibi, ışık yalnızca fincana düşer. Tek vurgu kehribar (crema rengi) yalnızca fiyat ve seçimde; yüzeyler zeminden bir ton açık, çizgi yok, ayrım boşlukla. Fotoğraflar siyah taş zeminde tek yönlü sert yan ışıkla düşük anahtarlı; hareket yavaş ve sıcak, özelleştiricide fincan katman katman dolar. | zemin `#14110F` · yüzey `#1E1A17` · krem `#EFE6D8` · soluk `#B3A796` · vurgu `#D9A55B` (zeminde 8,4:1) | DM Serif Display (başlık) + Figtree (gövde) | İlk tarama: 10 adayın 5'i marka logosu taşıdığı için elendi; kalan 5 aday zemin olarak dağınık (siyah, arduvaz, ahşap). Seri bulmak için daha geniş tarama gerekir. Temsilî: [Matthias Thijsen — siyah zeminde espresso](https://unsplash.com/photos/sjQEsvk96h0) `images.unsplash.com/photo-1615464637805-16154b4d5ea1` (5880 × 3920) |

**Görsel kaynağı:** Unsplash (Unsplash Lisansı, ticari kullanım serbest; "Sponsored" / Unsplash+ görseller kullanılmaz), gerekirse Pexels. Kaynağın CDN'inden özel loader ile sunulur; depoya indirilmez. Aday havuzu (ihtiyacın 3 katı) ve temas sayfası D-11'de. Ön tarama temas sayfaları bu oturumun çalışma klasöründeydi; D-11'de `docs/tasarim/` altında yeniden üretilir.

**Deneme mekânı riski:** Türk ev yemekleri (kuru fasulye, karnıyarık, sütlaç) için tek seri stok fotoğraf bulmak zordur. Hazır temanın fotoğrafsız ürün görünümü bu yüzden birinci sınıf tasarlanır; deneme mekânı fotoğrafı az bir mekân olarak kurgulanabilir (konsept önerisinde netleşir).

## Kaynaklar

- Fiyat Etiketi Yönetmeliğinde Değişiklik (RG 33044, 11.10.2025) — https://ozay.av.tr/publication/fiyat-etiketi-yonetmeligi-nde-yapilan-onemli-degisiklikler — 2026-11-04
- Ticaret Bakanlığı, "Fiyat Etiketinde Yeni Dönem Başlıyor" — https://ticaret.gov.tr/haberler/fiyat-etiketinde-yeni-donem-basliyor — 2026-11-04
- AA, "İşletmelere fiyat bilgisi paylaşım zorunluluğu getirildi" — https://www.aa.com.tr/tr/ekonomi/isletmelere-fiyat-bilgisi-paylasim-zorunlulugu-getirildi/3714178 — 2026-11-04
- Fiyat Etiketi Yönetmeliğinde Değişiklik (RG 33153, 30.01.2026) — https://www.alomaliye.com/2026/01/30/fiyat-etiketi-yonetmeliginde-degisiklik-30-01-2026/ — 2026-11-04
- Ticaret Bakanlığı, servis ücreti duyurusu — https://ticaret.gov.tr/haberler/ticaret-bakanligi-tarafindan-fiyat-etiketi-yonetmeliginde-degisiklik-yapildi — 2026-11-04
- AA, Bakanlık açıklaması — https://www.aa.com.tr/tr/ekonomi/ticaret-bakanligindan-fiyat-etiketi-yonetmeligindeki-degisiklige-iliskin-aciklama/3814937 — 2026-11-04
- TGK Gıda Etiketleme ve Tüketicileri Bilgilendirme Yönetmeliği (RG 29960) — Isparta İl Tarım ve Orman Md. PDF (bağlantı §5) — 2026-11-04
- Tarım ve Orman Bakanlığı, kılavuz güncelleme duyurusu — https://www.tarimorman.gov.tr/GKGM/Duyuru/681/Tgk-Gida-Etiketleme-Ve-Tuketicileri-Bilgilendirme-Yonetmeligi-Kilavuzu-Guncellendi — 2026-11-04
- İstanbul İl Tarım ve Orman Md., değişikliklere ilişkin açıklamalar — https://istanbul.tarimorman.gov.tr/Sayfalar/Detay.aspx?OgeId=465&Liste=Duyuru — 2026-11-04
- Güvenilir Gıda haberi (zincirler 01.07.2026) — https://guvenilirgida.tarimorman.gov.tr/Haber/Detay/18459 — 2026-11-04
- Vercel Limits — https://vercel.com/docs/limits — 2026-11-04
- Vercel Image Optimization Limits and Pricing — https://vercel.com/docs/image-optimization/limits-and-pricing — 2026-11-04
- Rakip ve örnek sayfalar: tablo §1 ve §9'daki bağlantılar — 2026-11-04
- Ad çakışması: "Rakım Kahve" ve "Kepçe Esnaf Lokantası" için İstanbul aramasında sonuç çıkmadı — 2026-11-04
