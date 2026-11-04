# Yönetim Paneli

> **Durum:** v1.1 · **Son güncelleme:** 2026-10-23
> **Kararlar:** [Bölüm 11](#11-kararlar)

## 1. Bu belge ne işe yarar

Panelin iskeletini ve ekran desenlerini tanımlar: kabuk, pano, liste, detay, form, toplu işlem, içe / dışa aktarma, bildirim, ayarlar. Hangi modülün hangi seviyede bulunduğu [karar mantığı §9](00-karar-mantigi.md#9-k8--yönetim-paneli-modülleri)'da, modüllerin içeriği [katalog/04-yonetim-paneli](../katalog/04-yonetim-paneli.md)'ndedir.

## 2. İlkeler

1. **Panel müşterinin günlük aracıdır.** Teknik bilgisi olmayan biri, kılavuza bakmadan en sık üç işi yapabilmelidir (plan §12'de yazılır: ör. "talebi yanıtla", "randevuyu onayla", "ilan ekle").
2. **Önce bugünün işi.** Panel açıldığında bekleyen işler görünür (yeni talepler, bugünkü randevular, onay bekleyen yorumlar); istatistik ikinci sırada.
3. **Her şey geri alınabilir ya da onaylıdır.** Silme çöp kutusuna gider; geri alınamayan işlem nesnenin adını içeren onay ister.
4. **Telefonda tam kullanılır.** Panel ekranları mobil standardına uyar ([07](07-mobil.md)); yönetici randevuyu otobüste onaylayabilmelidir.
5. **Türkçe ve sektörün dili.** "Lead" değil "Talep", "Entity" değil "İlan / Hasta / Rezervasyon".

## 3. Kabuk

| Öğe | Masaüstü | Telefon |
|---|---|---|
| Gezinme | Sol yan menü (gruplu, daraltılabilir). Modüller **yatay üst menüye dizilmez**: modül sayısı arttıkça üst menü satır kırar (nail-art-studio). | Alt sekme çubuğu (en fazla 5; fazlası "Daha fazla") |
| Üst çubuk | Genel arama (⌘K / Ctrl+K komut paleti S3+), bildirimler, kullanıcı menüsü, "Siteyi görüntüle" | Başlık + geri + sayfa eylemi |
| Sayfa başlığı | Başlık, kısa açıklama, birincil eylem (sağda) | Başlık; birincil eylem sağ altta yüzen düğme |
| Demo | Üstte "Demo panel: değişiklikler her gece sıfırlanır" şeridi | Aynı |

Rotalar Türkçe: `/panel`, `/panel/talepler`, `/panel/randevular/[id]`, `/panel/ayarlar/firma`. Tüm panel `noindex` ve `robots`'ta engelli.

## 4. Pano (özet)

- **Bekleyen işler** kartları: sayı + tıklayınca filtrelenmiş liste ("3 yeni talep", "Bugün 7 randevu", "2 yorum onay bekliyor").
- **Bugün** bölümü: sektöre göre takvim şeridi / günün siparişleri / bugünkü gösterimler.
- **Göstergeler** (S2+): son 30 gün talep sayısı ve kaynağı, dönüşüm oranı, en çok görüntülenen sayfalar / ilanlar. Her göstergede önceki dönemle karşılaştırma.
- **Hızlı eylemler:** en sık üç iş.
- Boş panoda (ilk kurulum) "Başlangıç listesi": firma bilgisini doldur, logo yükle, ilk hizmeti ekle, yasal metinleri gözden geçir.

## 5. Liste ekranı standardı

| Öğe | Kural |
|---|---|
| Arama | Üstte, ad / kod / telefon / e-postada; Türkçe karakter duyarsız; 300 ms gecikmeyle |
| Filtre | Durum, tarih aralığı, atanan kişi, kategori; seçili filtreler çip olarak; tümü URL'de |
| Hazır görünümler | Sekmeler: "Tümü · Yeni · Bekleyen · Tamamlanan"; S3+ kullanıcı kendi görünümünü kaydedebilir [Ö] |
| Sıralama | Varsayılan anlamlı (talepte en yeni, randevuda en yakın); başlığa tıklayınca |
| Sütunlar | Masaüstünde 5–7 sütun; ilk sütun tanımlayıcı (ad / kod) ve detaya bağlantı; tutar sağa hizalı, `tabular-nums` |
| Telefon | Kart listesi ([07 §5](07-mobil.md#5-tablolar-ve-yoğun-veri)) |
| Satır eylemleri | En sık iki eylem görünür (ör. "Onayla", "Ara"), diğerleri "…" menüsünde |
| Toplu işlem | Seçim kutuları → üstte eylem çubuğu ("12 kayıt seçildi: Durum değiştir · Ata · Dışa aktar · Arşivle"); toplu silme onaylı ve adet içerir |
| Sayfalama | 25 / 50 / 100; toplam kayıt sayısı görünür |
| Durumlar | Boş (ilk kayıt yok), boş (filtre sonucu yok → "Filtreleri temizle"), yükleniyor (iskelet satırlar), hata |
| Dışa aktarma | Görünen filtreyle CSV / Excel (S3+); kişisel veri içeren dışa aktarma `audit_logs`'a yazılır |

## 6. Detay ve düzenleme ekranı standardı

- **Üst bölüm:** başlık (ad / kod), durum rozeti, ana eylemler (durum geçişleri düğme olarak: "Onayla", "İptal et", "Kargoya ver"), "…" menüsünde ikincil eylemler.
- **Gövde:** masaüstünde iki sütun (sol: ana bilgiler ve sekmeler; sağ: özet kartı, ilişkili kayıtlar, atama). Telefonda tek sütun, özet kartı en üstte.
- **Sekmeler:** "Bilgiler · Etkinlik · Notlar · Dosyalar" (gereken kadar).
- **Etkinlik zaman çizelgesi:** kayıtla ilgili her olay (oluşturuldu, durum değişti, e-posta gönderildi, not eklendi) kim ve ne zamanla; S3+ `audit_logs`'tan.
- **Düzenleme:** ayrı sayfa ya da yerinde; uzun formlar bölümlere ayrılır; kaydedilmemiş değişiklikle çıkışta uyarı; kayıtta "Kaydedildi" bildirimi ve formda kalma.
- **İletişim kısayolları:** telefon, WhatsApp, e-posta düğmeleri (CRM ve talep kayıtlarında).
- Eşzamanlı düzenleme koruması S3+ ([05 §6](05-sunucu-ve-api.md#6-eşzamanlı-düzenleme)).

## 7. İçerik düzenleme

- Zengin metin düzenleyici sade: başlık (H2–H3), kalın, italik, liste, bağlantı, görsel, alıntı. Renk ve yazı tipi seçimi yok (tasarım token'lardan gelir).
- Her içerikte: taslak / yayında / arşiv durumu, yayın tarihi (ileri tarihli yayın S3+), SEO alanları (başlık, açıklama, OG görseli; boşsa otomatik), slug (otomatik, düzenlenebilir; değişince eski adres 301).
- "Önizle" düğmesi taslağı herkese açık şablonda gösterir.
- Görsel yüklemede alt metin istenir (boş bırakılırsa uyarı).
- Sıralanabilir listelerde (hizmetler, ekip, SSS) sürükle bırak + "yukarı / aşağı" düğmeleri.

## 8. Ayarlar

| Bölüm | İçerik |
|---|---|
| Firma | Ad, unvan, logo, kısa tanıtım, adres, harita konumu, vergi / MERSİS (künye için) |
| İletişim | Telefonlar, WhatsApp, e-posta, çalışma saatleri, resmî tatiller, sosyal medya |
| Görünüm | Tema preseti, ana sayfa bölümlerinin sırası ve görünürlüğü (S2+) |
| Özellikler | Özellik anahtarları (ör. "Online randevu açık", "Blog görünür") |
| Bildirimler | Hangi olayda kime bildirim gideceği; e-posta / SMS şablonları (S3+) |
| SEO | Varsayılan başlık kalıbı, açıklama, OG görseli, doğrulama kodları |
| Yasal | Yasal metinlerin sürümleri ve yürürlük tarihleri |
| Kullanıcılar | Davet, rol, devre dışı bırakma (S2+) |

Ayarlar `site_settings` tablosundadır ([02 §4](02-mimari.md#4-yapılandırma-düzeyleri)); her kayıt sürümlenir, "Önceki sürüme dön" S3+.

## 9. Bildirimler

- Yeni talep / randevu / sipariş için: panel içi bildirim + e-posta (demo'da demo kutusu); S3+ kişi bazında tercih.
- Panel içi bildirim listesi okundu / okunmadı; bildirim ilgili kayda götürür.
- Müşteriye giden mesajlar (randevu onayı, hatırlatma, sipariş durumu) şablonla; şablon değişkenleri listelenir; gönderim kayda bağlı etkinliğe yazılır.

## 10. Sistem ekranları

| Ekran | Seviye | İçerik |
|---|---|---|
| Demo kutusu | Demo'da tümü | Gönderilmiş gibi yapılan e-posta / SMS / WhatsApp mesajları; önizleme |
| Çöp kutusu | S2+ | Silinen içerikler, geri al / kalıcı sil |
| İşlem geçmişi | S3+ | Kim, ne zaman, ne değişti; filtrelenebilir |
| Yönlendirmeler | S3+ | 301 listesi, 404 raporu (en çok istenen bulunamayan adresler) |
| Sistem sağlığı | S4 | Veritabanı bağlantısı, son yedek, zamanlanmış işlerin son çalışması, e-posta gönderim durumu |
| Yardım | S2+ | Admin kılavuzunun panel içi özeti, "Destek iste" bağlantısı |

## 11. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| AP-01 | Panel konumu | Aynı uygulamada `/panel` | Tek dağıtım, ortak şema ve bileşenler (Revnak, Bütçe). |
| AP-02 | Mobil panel | Alt sekme çubuğu + kart listesi | Yöneticinin panele çoğunlukla telefondan girmesi. |
| AP-03 | Silme | Çöp kutusu + onay | Müşteri hatası geri alınabilir; destek yükü azalır. |
| AP-04 | Pano | Önce bekleyen işler | Panel bir rapor değil iş aracı. |
| AP-05 | Ekran desenleri | Tek liste / detay standardı | Her modül aynı davranır; öğrenme yükü bir kez. |
| AP-06 | Masaüstü gezinme | Yalnızca yan menü | nail-art-studio'da yatay üst menü geniş ekranda iki satıra bölündü; yan menü modül sayısıyla ölçeklenir. |

## 12. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | Masaüstünde yalnızca yan menü (AP-06). |
