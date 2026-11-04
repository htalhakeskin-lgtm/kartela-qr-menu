# Yasal Uyum ve KVKK

> **Durum:** v1.0 · **Son güncelleme:** 2026-10-16
> **Kararlar:** [Bölüm 11](#11-kararlar)

> **Uyarı:** Bu belge teknik uygulama standardıdır, hukuki görüş değildir. Yasal metin şablonları ([sablonlar/yasal](../sablonlar/yasal/)) başlangıç noktasıdır; canlı projede müşterinin hukuk danışmanı onaylar. Mevzuat değişir: her projenin araştırma fazında ([AKIS Faz 1](../AKIS.md)) sektöre özgü güncel kurallar doğrulanır.

## 1. Bu belge ne işe yarar

Türkiye'de yayımlanan bir sitenin KVKK, çerez, ticari ileti ve (varsa) e-ticaret yükümlülüklerini koda nasıl yansıtacağını tanımlar.

## 2. Hangi metin ne zaman

| Metin / yükümlülük | Ne zaman | Etiket |
|---|---|---|
| KVKK aydınlatma metni | Kişisel veri toplanan her sitede (iletişim formu bile) | [Z] |
| Çerez politikası + çerez tercih paneli | Her sitede; zorunlu dışı çerez yoksa yalın politika, panel yok | [Z] |
| Gizlilik politikası | Her sitede | [Z] |
| Açık rıza metinleri | Özel nitelikli veri (sağlık, biyometrik…), pazarlama, yurt dışı aktarımda açık rıza dayanağı seçildiyse | Paket (K4) |
| Ticari elektronik ileti onayı + İYS | E-posta / SMS ile kampanya, bülten gönderilecekse | [Ö] |
| Kullanım koşulları | Üyelik, kullanıcı içeriği, rezervasyon / sipariş varsa | [Ö] |
| Mesafeli satış sözleşmesi, ön bilgilendirme formu, iade ve cayma koşulları | İnternetten ödeme alınıyorsa | Paket (K4: ödeme) |
| Künye / şirket bilgileri | Ticari sitede: unvan, adres, iletişim, (e-ticarette) MERSİS, vergi no. | [Z] |
| Erişilebilirlik beyanı | [08 §8](08-erisilebilirlik.md#8-erişilebilirlik-beyanı-ö) | [Ö] |

Metinler `content/yasal/*.md` dosyalarında, ön bilgiyle (`baslik`, `surum`, `yururluk`) tutulur ve sürümlenir. Değişiklik yeni sürüm açar; onay kayıtları hangi sürüme onay verildiğini tutar.

## 3. Formlar

- **Aydınlatma onay değildir.** Formun altında "Kişisel verileriniz [Aydınlatma Metni] kapsamında işlenir." bağlantısı yeterlidir; zorunlu "okudum" kutusu konmaz.
- **Açık rıza ayrı, işaretsiz ve isteğe bağlı kutudur.** Hizmetin şartı yapılmaz, başka onayla birleştirilmez ("Kampanyalardan haberdar olmak istiyorum" ayrı; "sağlık bilgimin işlenmesine açık rıza" ayrı).
- Toplanan alan en azdır: randevu için ad + telefon yeterliyse e-posta ve doğum tarihi istenmez (veri en aza indirme).
- Serbest metin alanının yanında "Sağlık bilgisi gibi özel nitelikli veri paylaşmayınız." notu [Ö] (sağlık dışı sektörlerde).
- Form metinleri: [sablonlar/yasal/acik-riza-ve-form-metinleri.md](../sablonlar/yasal/acik-riza-ve-form-metinleri.md).

## 4. Onay kayıtları

Her onay ve geri çekme, `consent_records` tablosuna **yalnızca ekleme** ile yazılır:

| Alan | İçerik |
|---|---|
| `kind` | `cookieAnalytics`, `cookieMarketing`, `marketingEmail`, `marketingSms`, `healthData`, `crossBorderTransfer`… |
| `granted` | `true` (verdi) / `false` (reddetti ya da geri çekti) |
| `text_version` | Onay verilen metnin sürümü |
| `source` | Formun / panelin adı (`contactForm`, `cookieBanner`, `accountSettings`) |
| `subject_ref` | Talep / üye kimliği ya da anonim ziyaretçi kimliği (çerez onayında) |
| `ip_hash` | Tuzlu karma (düz IP tutulmaz) |
| `created_at` | An |

- Geçerli durum, aynı kişi + tür için en son kayıttır.
- Onay geri çekme, verildiği kadar kolaydır (alt bilgide "Çerez tercihleri", e-postada tek tıkla abonelikten çık, hesapta onay ayarları).
- Ticari ileti onayları İYS'ye de iletilir (canlıda; İYS entegrasyonu ya da toplu yükleme, plan §14).

## 5. Çerezler

| Kategori | Örnek | Onay |
|---|---|---|
| Zorunlu | Oturum, CSRF, çerez tercihinin kendisi, sepet | Gerekmez |
| İşlevsel | Dil, son bakılan ilanlar | Gerekir |
| Analitik | GA4, Hotjar | Gerekir (çerezsiz analitik kullanılıyorsa bu kategori boş) |
| Pazarlama | Meta Pixel, Google Ads | Gerekir |

- Panel ilk ekranda: "Kabul et", "Reddet" ve "Tercihler" **eşit görünürlükte**; önceden işaretli kutu yok; kaydırma ya da sayfada gezinme onay sayılmaz.
- Onaydan **önce** zorunlu dışı hiçbir betik, piksel ya da gömülü içerik (YouTube, Instagram gömmesi) yüklenmez; gömülü içerik onaya kadar yer tutucuyla gösterilir ("Videoyu izlemek için YouTube çerezlerine izin verin").
- Harita: MapLibre + OpenFreeMap çerez kullanmaz; Google Haritalar gömmesi çerez onayına tabidir.
- Tercih 12 ay saklanır, sonra yeniden sorulur; politika sürümü değişince yeniden sorulur.
- Denetim: e2e testi onaysız ilk yüklemede üçüncü taraf istek olmadığını doğrular.

## 6. Yurt dışına aktarım ve hizmet sağlayıcılar

- Her projede plan §14'te **veri işleyen tablosu** bulunur: sağlayıcı, işlenen veri, sunucu konumu, aktarım dayanağı. Varsayılan yığında: Vercel (barındırma, AB / ABD), Neon (veritabanı, Frankfurt), Resend (e-posta, ABD), Vercel Blob / R2 (dosya), analitik sağlayıcısı.
- Veritabanı ve fonksiyonlar AB bölgesinde tutulur (Frankfurt); bu, aktarımı ortadan kaldırmaz ama riski azaltır.
- 2024'te değişen KVKK m.9 ve yönetmeliği uyarınca yurt dışı aktarımda dayanak (yeterlilik kararı, uygun güvenceler, standart sözleşme…) müşteriyle belirlenir. **Standart sözleşme** kullanılıyorsa imzadan sonra **5 iş günü içinde** Kurum'a bildirim yapılır. Bu adım teslim kontrol listesinde yer alır.
- Aydınlatma metni, aktarımın yapıldığı sağlayıcı kategorilerini ve amaçlarını sayar.
- VERBİS kayıt yükümlülüğü müşterinin durumuna göre değerlendirilir (eşikler ve muafiyetler değişebilir; araştırma fazında doğrulanır).

## 7. Saklama ve imha

Varsayılan süreler (müşteri ve hukuk danışmanıyla kesinleşir, plan §14'e yazılır):

| Veri | Varsayılan süre | Sonra |
|---|---|---|
| İletişim / teklif talebi (sonuçlanmamış) | 2 yıl | Anonimleştirme |
| Randevu kaydı (sağlık dışı) | 3 yıl | Anonimleştirme |
| Sağlık verisi | İlgili sağlık mevzuatındaki süre; site yalnızca randevu ön bilgisini tutar | Mevzuata göre |
| Sipariş / fatura | Vergi mevzuatı süresi (10 yıl) | Silme |
| Pazarlama onayı geri çekildiyse iletişim bilgisi | Geri çekmeden itibaren ispat için gereken süre | Silme |
| Sunucu ve uygulama logları | 90 gün | Silme |
| Demo kutusu | 30 gün | Silme |

- Zamanlanmış iş (cron) süresi dolan kayıtları işler; her çalışma `audit_logs`'a özet yazar.
- Anonimleştirme: ad, telefon, e-posta, serbest metin silinir; istatistik alanları (tarih, hizmet, kaynak) kalır.

## 8. İlgili kişi başvuruları ve ihlal

- Aydınlatma metninde başvuru yolu (e-posta, posta adresi). Panelde [Ö] S3+: kişinin verilerini bulma, dışa aktarma ve silme ekranı ("Kişi verisi" araması).
- Başvurulara en geç 30 gün içinde yanıt verilir; panel, başvuru tarihini ve yanıt tarihini kaydeder.
- Veri ihlali şüphesinde müşteri bilgilendirilir; Kurul'a bildirim süresi (72 saat) teslim belgesinde yazılıdır.

## 9. E-ticaret ve ödeme

- Ödeme adımından önce ön bilgilendirme formu ve mesafeli satış sözleşmesi gösterilir ve onaylanır; onay sürümüyle kaydedilir; sipariş e-postasında da yer alır.
- Fiyatlar vergiler dahil gösterilir; kargo ücreti ödeme öncesi bellidir.
- Cayma hakkı ve istisnaları (kişiye özel üretim, hizmetin ifasına başlanmış olması, belirli tarihli konaklama / etkinlik) sayfada açık yazılır.
- Kart bilgisi sitede tutulmaz ve sunucudan geçmez; ödeme kuruluşunun sayfası ya da iframe'i kullanılır.
- ETBİS kaydı ve e-fatura / e-arşiv entegrasyonu müşteriyle planlanır.

## 10. Sektöre özgü uyarılar (araştırma fazında doğrulanır)

| Sektör | Dikkat |
|---|---|
| Sağlık (diş, estetik, diyetisyen, veteriner) | Sağlık hizmetlerinde reklam ve tanıtım kısıtları; öncesi / sonrası görselleri, "en iyi", "garantili" gibi ifadeler, fiyat ve kampanya ilanı. Hasta yorumlarının yayımı. Sağlık verisi açık rıza. |
| Hukuk | Avukatlık meslek kurallarındaki reklam yasağı: site bilgilendirici olur; başarı iddiası, müvekkil adı, fiyat kampanyası yer almaz. |
| Emlak | İlanlarda yetki belgesi numarası ve ilan bilgisi doğruluğu; sahibinden / yetkili ayrımı. |
| Gıda / restoran | Alerjen bilgisi, fiyat listesinin görünür olması, (alkol satışı varsa) yaş ve reklam kısıtları. |
| Eğitim / çocuk | Çocuk verisi, veli onayı; görsellerde çocuk yüzü kullanımı. |
| Finans / sigorta | Lisans bilgisi, risk uyarıları; kesin getiri vaadi yok. |

Bu satırlar her sektör kataloğunda ayrıntılandırılır ve plan §14'e o projeye uyan maddeler aktarılır.

## 11. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| YS-01 | Aydınlatma / rıza ayrımı | Aydınlatma bağlantı; açık rıza ayrı, işaretsiz kutu | KVKK uygulaması; brifteki "onay kutusu" isteği bu ayrımla netleştirildi. |
| YS-02 | Onay kaydı | Yalnızca ekleme, metin sürümüyle | İspat yükü veri sorumlusundadır. |
| YS-03 | Varsayılan analitik | Çerezsiz | Çerez paneli olmadan da ölçüm. |
| YS-04 | Yurt dışı aktarım | Plan §14'te veri işleyen tablosu + teslim listesinde bildirim adımı **[+]** | 2024 değişikliği yeni bir yükümlülük getirdi; çoğu küçük proje bunu atlıyor. |
| YS-05 | Silme | Süre sonunda gerçek silme / anonimleştirme | Yumuşak silme KVKK silme yükümlülüğünü karşılamaz ([04 §6](04-veri.md#6-silme-ve-kvkk)). |

## 12. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
