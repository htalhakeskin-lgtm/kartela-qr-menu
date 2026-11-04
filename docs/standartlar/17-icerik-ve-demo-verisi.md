# İçerik ve Demo Verisi

> **Durum:** v1.2 · **Son güncelleme:** 2026-10-30
> **Kararlar:** [Bölüm 9](#9-kararlar)

## 1. Bu belge ne işe yarar

Demo içeriğinin gerçekçi, Türkçe, yasal açıdan güvenli ve portfolyoda iyi görünen biçimde üretilmesini sağlar. Seed betiğinin teknik kuralları [04 §11](04-veri.md#11-seed-ve-sıfırlama)'dedir.

## 2. İlkeler

1. **Lorem ipsum yok.** Her metin sektöre özgü, anlamlı Türkçedir. Yer tutucu metin yayına çıkmaz (kalite kapısı 9).
2. **Kurgusal ama inandırıcı.** Firma, kişi ve yorumlar kurgusaldır ve kurgusal oldukları açıkça işaretlenir; içerik gerçek bir işletmenin yazacağı kalitededir.
3. **Gerçek kimseye ulaşmaz.** Demo'daki telefon, e-posta ve adresler gerçek bir kişiye ya da işletmeye ait olamaz.
4. **Uç durumları göster.** Demo verisi yalnızca mükemmel kayıtlardan oluşmaz; uzun başlık, eksik görsel, iptal, boş kategori arayüzün dayanıklılığını gösterir.

## 3. Kurgusal kimlikler

| Öğe | Kural | Örnek |
|---|---|---|
| Firma adı | Sektöre uygun, Türkçe, akılda kalıcı; aynı şehir + sektörde gerçek bir işletmeyle çakışmadığı aramayla kontrol edilir | "Lâl Diş Kliniği", "Revnak Gayrimenkul" |
| Logo | Projeye özgü üretilir (SVG, kelime işareti + basit simge); gerçek marka andırmaz | — |
| Kişi adları | Çeşitli, gerçekçi Türkçe ad-soyad kombinasyonları; ünlü ya da kamuya mal olmuş kişi adı yok | "Dt. Elif Karaca" |
| Telefon (işletmenin kendi hattı) | **Varsayılan: geliştiricinin hattı `0542 311 58 88` (`+905423115888`).** Sitenin telefonu, WhatsApp hattı ve yasal metinlerdeki iletişim numarası bu numaradır; demo ziyaretçisi aradığında ya da yazdığında geliştiriciye ulaşır. `site-defaults.ts` ve yasal şablonlar bunu taşır | `0542 311 58 88` |
| Telefon (kurgusal kişiler) | Müşteri, personel, danışman numaraları `000` blokta ya da kullanılmayan bir aralıkta (`0555 000 10 01`); telefonun benzersiz anahtar olduğu kayıtlarda (müşteri kartı) tek numara kullanılamaz | `0532 000 45 67` |
| WhatsApp | İşletmenin hattıyla aynı; mesaj taslağı sayfa bağlamıyla dolu | — |
| E-posta | `example.com` ya da `.test` alan adları (RFC 2606) | `iletisim@lal-dis.example.com` |
| Adres | Gerçek ilçe / mahalle, kurgusal sokak ve kapı no | "Moda Cad. No: 00, Kadıköy / İstanbul" |
| Harita konumu | İlçenin genel bölgesi; gerçek bir işletmenin üstü değil | — |
| Vergi / MERSİS / yetki belgesi / sertifika no | Demo'da **gösterilmez**; alan gizlenir. Yasal metinde gerekiyorsa açıkça örnek (`0000000000`) | — |

**İmza:** her sitenin alt bilgisinin son satırında, demo notunun karşısında **"Created by Talha Keskin"** bulunur; sitenin etiket diliyle (konseptin küçük etiket yazı tipi, harf aralığı, soluk renk; ad ön plan renginde), "Created by" `lang="en"`. Telefonda demo notunun altına iner. Bileşen: iskelet `src/components/layout/site-credit.tsx`. Demo'da ve canlıda görünür (canlıda müşteriyle konuşulur).

**Demo notu üç yerde toplanır:** üst şerit, alt bilgi ve yasal metinler ("Bu site gösterim amaçlı bir demodur; firma, kişi ve yorumlar kurgusaldır."). Sayfa içine "(örnek adres)", "örnek numara", her görselin altına "temsilîdir" serpiştirilmez; "Örnek yorum" ibaresi yorum bölümünün başlığında bir kez yazılır ([20 GK-16](20-gorsel-kalite.md#4-profesyonel-görünüm-çıtası)).

## 4. Metin üslubu

| Konu | Kural |
|---|---|
| Hitap | Ziyaretçiye "siz"; samimi ama profesyonel. Sektöre göre ton plan §11'de (metin tonu): sağlıkta güven veren ve sakin, restoranda sıcak ve iştah açıcı, hukukta ölçülü ve bilgilendirici. |
| Başlık | Fayda odaklı ve somut: "Tek seansta beyazlatma, 60 dakikada" > "Kaliteli hizmet". |
| Abartı | "En iyi", "1 numara", "garantili" kullanılmaz (sağlık ve hukukta ayrıca yasal risk, [10 §10](10-yasal-ve-kvkk.md#10-sektöre-özgü-uyarılar-araştırma-fazında-doğrulanır)). |
| Sayılar | Gerçekçi ve tutarlı: "12 yıllık deneyim" ise ekip ve referanslar da buna uyar. |
| Fiyat | Sektörün o yılki gerçekçi aralığında; KDV dahil yazılır. |
| Mikro metin | Düğme, boş durum, hata ve onay metinleri plan §6'da ekranla birlikte yazılır. |
| Yorumlar | "Örnek yorum" etiketiyle; yapılandırılmış veri basılmaz. Ad yalnızca ad + soyadın baş harfi ("Ayşe K."). |
| Blog | Gerçek bilgi içeren, sektörde sık sorulan konular; sağlık ve hukuk içeriğinde "bilgilendirme amaçlıdır" notu. |

Yapay zekâ ile üretilen metin kontrol edilir: tekrar eden kalıplar ("…dünyasına adım atın", "…ile tanışın"), anlamsız övgü ve yanlış bilgi temizlenir.

## 5. Görseller

Görsel arama, kabul ölçütleri (çözünürlük, seri tutarlılığı, konu), aday havuzu ve temas sayfası [20 §5](20-gorsel-kalite.md#5-görsel-araştırma-ve-seçim)'tedir. Bu bölüm kaynak türlerini ve kayıt kurallarını verir.

| Kaynak | Kullanım | Kayıt |
|---|---|---|
| Ticari kullanıma açık stok (Unsplash, Pexels vb.) | Mekân, ürün, atmosfer | Bağlantı, fotoğrafçı, lisans |
| Yapay zekâ ile üretilmiş | Kurgusal ekip portreleri, ürün, öncesi / sonrası benzeri gösterimler | Araç adı, istem, tarih; "temsilîdir" notu |
| Projeye özgü çizim / SVG | Logo, ikon, desen, harita işaretçisi | — |
| Müşterinin kendi görselleri | Gerçek mekân, ekip ve işler. **Orijinal dosya** istenir; Instagram kopyası (≤ 1080 px) yalnızca kart / galeri boyutunda | İzin / sözleşme |

- **Kayıt dosyası:** `docs/gorsel-kaynaklari.md` (görsel → kaynak → lisans). Kaynağı belirsiz görsel kullanılmaz.
- Gerçek bir kişinin tanınır fotoğrafı "ekibimiz" ya da "müşterimiz" olarak kullanılmaz; stok model fotoğrafı ekip üyesi gibi sunulacaksa yapay zekâ portresi tercih edilir ve demo notu bulunur.
- Gerçek marka logosu, tanınır ürün ambalajı, plakası okunan araç, başkasına ait sanat eseri kullanılmaz.
- Biçim: AVIF / WebP; kaynak çözünürlüğü rolüne göre en az 2400 / 1600 / 800 px ([20 §5.3](20-gorsel-kalite.md#53-kabul-ölçütleri)); dosya adı Türkçe ASCII ve açıklayıcı (`kadikoy-salon-genel.webp`). Stok görseller depoya indirilmez, CDN'den sunulur ([20 §6](20-gorsel-kalite.md#6-görsel-teslimi)).
- Bir görsel sitede tek rolde kullanılır (GK-03).
- Oranlar tutarlı: kart 4:3, kapak 16:9, portre 4:5, galeri karışık ama ızgara sabit.
- Her görselin alt metni seed'de yazılıdır.
- Ton: aynı projedeki görseller benzer ışık ve renk sıcaklığında; gerekirse hafif renk eşitleme.

## 6. Hacim (seviyeye göre)

| Varlık | S1 | S2 | S3 | S4 |
|---|---|---|---|---|
| Hizmet / ürün / ilan | 6–10 | 10–20 | 30–60 | 100+ |
| Ekip | 3–4 | 4–8 | 6–12 | — |
| Galeri / proje | 8–12 | 12–24 | 24+ | — |
| Örnek yorum | 4–6 | 6–12 | 12+ | 30+ |
| Blog yazısı | — | 4–6 | 8–12 | 12+ |
| SSS | 6–10 | 10–15 | 15+ | 20+ |
| Talep / CRM kaydı (son 90 gün) | 10–20 | 30–60 | 100–200 | 300+ |
| Randevu / rezervasyon (geçmiş + gelecek) | — | 40–80 | 150+ | 300+ |
| Sipariş (son 6 ay) | — | — | — | 200+ |

Panel grafiklerinin anlamlı görünmesi için kayıtlar zamana dağıtılır (hafta içi / hafta sonu farkı, mevsimsellik, kaynak dağılımı: Google %40, Instagram %25, tavsiye %20, diğer).

**Geçmiş verisi (S2+):** rapor, takvim, müşteri kartı ya da doluluk gösteren dilimlerden **önce** tohum 8–12 haftalık bir geçmiş üretir: her iş gününde gerçekçi sayıda kayıt, çoğu tamamlanmış, az sayıda gelmedi / iptal. Rastgele değil **sabit desenle** (gün × slot modülü) üretilir; her tohumda aynı sonuç. Elle yazılmış senaryo kayıtları önce eklenir, üretilen geçmiş çakışmada geri çekilir. Seyrek veri raporu boş gösterir ve yoğun veride çıkan arayüz kusurlarını saklar; tohum değişince tam e2e paketi yeniden koşulur ([14 §6](14-test.md)).

## 7. Demo senaryosu

Her projenin plan §19'unda 3–5 dakikalık bir demo senaryosu bulunur ve e2e testiyle korunur. Örnek (diş kliniği):
1. Ziyaretçi telefondan ana sayfaya girer, "Diş beyazlatma" hizmetini açar, fiyat aralığını ve süreci görür.
2. "Randevu al" ile hekim ve saat seçer, formu doldurur, onay kodunu alır, takvime ekler.
3. Yönetici panelde bildirimi görür, randevuyu onaylar; demo kutusunda hastaya giden onay mesajı görünür.
4. Pano: bu haftanın randevuları, talep kaynakları.

## 8. İçerik teslimi (canlı)

- Müşteriden içerik toplama listesi plan §14'te (logo, fotoğraflar, ekip bilgileri, hizmet açıklamaları, fiyatlar, sertifikalar).
- İçerik gelmezse demo içeriği "taslak" olarak kalır ve canlıya geçiş listesinde işaretli kalır; kurgusal içerik canlıda gerçekmiş gibi yayınlanmaz.

## 9. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| IC-01 | Telefon numaraları | İşletmenin hattı: geliştiricinin numarası `0542 311 58 88` (varsayılan); kurgusal kişiler: `000` / kullanılmayan blok | Rastgele görünen numara gerçek birine ait olabilir. Revnak K18'de geliştiricinin ofis hattı kullanıldı; Levha K-78'de kullanıcı bunu tüm projeler için varsayılan yaptı (D-053). |
| IC-02 | E-posta alan adı | `example.com` / `.test` | Ayrılmış alan adları; gönderim kazası olmaz. |
| IC-03 | Yorum | Etiketli, şemasız | Yanıltıcı olmama + Google politikası. |
| IC-04 | Görsel kaydı | Zorunlu kaynak dosyası | Lisans sorunu portfolyoda ve canlıda risk. |
| IC-05 | Hacim | Seviyeye göre tablo | Panelin dolu ve gerçekçi görünmesi portfolyonun en güçlü kanıtı. |
| IC-07 | Alt bilgi imzası | "Created by Talha Keskin", sitenin etiket stiliyle | Kullanıcı isteği (Levha K-78, D-054): işin sahibi her sitede görünür; tema dışı bir rozet değil, sitenin kendi diliyle. |
| IC-08 | Geçmiş verisi | Sabit desenli 8–12 hafta, ilgili dilimlerden önce | Levha D-28: seyrek veride piercing doluluğu %0 göründü; yoğun veri takvimde saklı bir dokunma hedefi kusurunu ortaya çıkardı (D-047). |
| IC-06 | Demo notu yeri | Şerit + alt bilgi + yasal metin; kurgusal belge numarası gösterilmez | nail-art-studio'da sayfaya serpiştirilmiş "örnek" ibareleri ve `HE-0000` gibi yer tutucular siteyi amatör gösterdi; dürüstlük üç sabit yerde zaten sağlanıyor. |

## 10. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | Demo notu üç yerde toplandı (IC-06); görsel seçimi 20-gorsel-kalite'ye bağlandı; müşteri görsellerinde orijinal dosya kuralı. |
| 2026-10-30 | v1.2 | İşletme hattı varsayılanı geliştiricinin numarası (IC-01, D-053); alt bilgi imzası (IC-07, D-054); sabit desenli geçmiş verisi (IC-08, D-047). |
