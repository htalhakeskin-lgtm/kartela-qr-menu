# Karar Mantığı

> **Durum:** v1.1 · **Son güncelleme:** 2026-10-23
> **Kararlar:** [Bölüm 11](#11-kararlar)

## 1. Bu belge ne işe yarar

Bir konu verildiğinde planın neyi içereceğine **aynı sırayla ve aynı ölçütlerle** karar verilmesini sağlar. Amaç iki hatayı birden önlemek:
- basit bir işin günlerce süren bir projeye dönüşmesi,
- derin olması gereken bir işin üstünkörü geçilmesi.

Her adımın çıktısı `proje-plani.md`'de belirli bir bölüme yazılır. Bir adım atlanmaz; sonucu "uygulanmaz" olsa bile gerekçesiyle yazılır.

## 2. Karar zinciri

| Sıra | Karar | Girdi | Çıktı | Planda |
|---|---|---|---|---|
| K1 | Kapsam seviyesi (S1–S4) | Konu, brif, araştırma | Seviye + gerekçe + zaman kutusu | §2 |
| K2 | Hesap modeli (A–D) | Ziyaretçi işlemleri | Model + kimlik doğrulama yöntemi | §8 |
| K3 | Teknoloji varyantı | Barındırma kısıtı, istemciler | V0 / V1 / V2 + alt kararlar | §10 |
| K4 | Paket tetikleyicileri | K1–K3 + özellik adayları | Zorunlu hale gelen paketler | §5, §14, §15 |
| K5 | Özellik seçimi | Katalog + sektör modülü | Puanlı aday listesi | §5 |
| K6 | Öncelik ve bütçe | K5 + zaman kutusu | P0 / P1 / P2, efor | §5, §22 |
| K7 | CRM ve süreç yapısı | Satış / randevu / sipariş akışı | Süreç tipi ve aşamalar | §13 |
| K8 | Yönetim paneli modülleri | K1 + seçilen özellikler | Modül listesi + rol matrisi | §8, §12 |
| K9 | Kalite kapıları seviyesi | K1 | Test ve kapı listesi | §18 |
| K10 | Tasarım konsepti | Sektör modülü §10 + araştırma §9 (referanslar, görsel bulunabilirliği) | İki konsept önerisi → onayda seçilen; token, sahne, görsel yönü | §11 |

Zincir sırayla işler; sonraki bir karar öncekini değiştiriyorsa (ör. K5'te ödeme çıktı, seviye S4'e çıkmalı) zincir o noktadan yeniden yürütülür ve plana yazılır.

## 3. K1 — Kapsam seviyesi

### 3.1 Kilit sinyaller

Eşleşen **en yüksek** sinyal, en düşük seviyeyi belirler.

| Sinyal | En az |
|---|---|
| Online ödeme / sepet / sipariş | S4 |
| Zorunlu kullanıcı hesabıyla kişisel veri işleyen uygulama (bütçe, hasta portalı, öğrenci paneli) | S4 |
| Çok kiracılı yapı (her müşterinin verisi birbirinden ayrık) | S4 |
| Filtreli, aranabilir katalog (≥ 20 kayıt: ilan, ürün, araç, oda) | S3 |
| Çok kaynaklı müsaitlik (personel × hizmet süresi × izin × tatil) | S3 |
| Satış hunisi / CRM, birden fazla personel rolü | S3 |
| Etkileşimli araçlardan (hesaplayıcı, sihirbaz, harita, karşılaştırma) en az üçü | S3 |
| 5'ten fazla sayfa, blog, form, tek kaynaklı randevu, teklif, içerik yönetimi | S2 |
| Tek sayfa ya da ≤ 5 sayfalık tanıtım, iletişim formu | S1 |

### 3.2 Düzelticiler

- **Aşağı:** Müşterinin açık bütçe / süre sınırı; paylaşımlı hosting zorunluluğu (V0'a götürür, bkz. §5).
- **Yukarı:** Yalnızca yeni bir kilit sinyal çıkarsa. "Etkileyici olsun" isteği seviyeyi yükseltmez; bunun yerine o seviyenin **fark yaratan özellik payını** kullanır (§7.4).
- Seviye en fazla bir kademe değiştirilir ve gerekçesi yazılır.

### 3.3 Seviye profili

| Konu | S1 Vitrin | S2 Kurumsal+ | S3 Platform | S4 Sistem |
|---|---|---|---|---|
| Hedef zaman kutusu (odaklı gün) ¹ | ≤ 1 | 1–3 | 3–8 | 10+ (fazlara bölünür) |
| Efor bütçesi (puan, §7.3) ¹ | ≤ 10 | ≤ 30 | ≤ 70 | Faz başına ≤ 70 |
| Plan derinliği | Kısaltılmış: 23 bölüm, çoğu birkaç satır | Tam, kısa | Tam | Tam + `docs/` alt belgeleri |
| Numaralandırma | `SCR`, `K` | + `REQ`, `BR` | + `UC`, `NFR`, modül önekli `BR-MOD-nnn` | + `ADR` zorunlu, izlenebilirlik betiği |
| Veritabanı | Neon (form kayıtları, ayarlar) | Neon | Neon | Neon + yedekleme planı |
| Hesap | Yalnızca yönetici | Yönetici (+ B modeli) | Yönetici rolleri (+ B/C) | C/D modeli, 2FA |
| Yönetim paneli | Hafif (§8) | Orta | Tam | Tam + sistem |
| Test (en az) | Duman + mobil taşma + erişilebilirlik | + form/eylem entegrasyon, her `BR` | + alan birim testleri, yetki/sahiplik | + kiracı yalıtımı, ödeme akışı, demo senaryosu e2e |
| CI | lint + typecheck + build + e2e duman | + entegrasyon | + gece tüm tarayıcılar | + güvenlik denetimleri genişletilmiş |
| Demo verisi | Gerçekçi metin ve görseller | + 10–30 içerik kaydı | + 30–150 kayıt, uç durumlar | + çok kullanıcılı senaryo |
| Portfolyo | 4–6 görsel, 1 mockup | 6–10, 1–2 mockup | 8–15, 2–3 mockup | 10–15, 3 mockup |

¹ Yapay zekâ destekli tek geliştirici için başlangıç değerleridir. Her projeden sonra `DERSLER.md` ile kalibre edilir.

## 4. K2 — Hesap modeli

Varsayılan eğilim: **hesap gerekmiyorsa hesap istenmez.** Sorular sırayla sorulur; ilk "evet" modeli belirler.

| Soru | Evet ise |
|---|---|
| 1. Ziyaretçi kendine ait, sürekli büyüyen kişisel veriyi tekrar tekrar görmek zorunda mı? (finans kaydı, sağlık geçmişi, ders ilerlemesi) | **D: Zorunlu hesap** |
| 2. Tekrar eden ziyaretçiye hesap somut kazanç sağlıyor mu? (geçmiş randevular, cihazlar arası favoriler, sadakat puanı) | **C: Opsiyonel hesap** (misafir yolu her zaman açık) |
| 3. Ziyaretçi bir işlem yapıyor mu? (randevu, sipariş, başvuru) | **B: Misafir işlem** (e-posta / SMS bağlantısıyla ya da kod + telefonla takip) |
| 4. Hiçbiri | **A: Hesapsız** (yalnızca yönetici girişi) |

| Model | Ziyaretçi kimlik doğrulaması | Yönetici | KVKK etkisi |
|---|---|---|---|
| A | Yok. Favoriler, karşılaştırma tarayıcıda (localStorage). | E-posta + şifre | En düşük |
| B | Yok. İşlem başına imzalı, süreli yönetim bağlantısı; ya da kod + telefon sorgusu. | E-posta + şifre | İşlem verisi; saklama süresi tanımlanır |
| C | Sihirli bağlantı ya da e-posta kodu; [S] Google ile giriş | E-posta + şifre, S3+ için [Ö] 2FA | Hesap silme, veri indirme, rıza yönetimi |
| D | E-posta + şifre + e-posta doğrulama + sıfırlama; [Ö] 2FA; oturum listesi | E-posta + şifre + 2FA | C'nin tamamı + sızmış şifre kontrolü |

Kütüphane: veritabanı olan her V1 projesinde **Better Auth** (veriler kendi veritabanımızda, oturumlar sunucuda, hız sınırı ve yönetici eklentisi hazır). Gerekçe ve istisna: [11-guvenlik §4](11-guvenlik.md#4-kimlik-doğrulama-ve-oturum).

## 5. K3 — Teknoloji varyantı

| Varyant | Ne zaman | Yığın |
|---|---|---|
| **V1 — Varsayılan** | Diğer iki koşul yoksa | Next.js tam yığın, Vercel + Neon ([01](01-teknoloji-yigini.md)) |
| **V0 — Hafif** | S1 **ve** müşteri paylaşımlı hosting şart koşuyor **ve** kayıt işleyen özellik yok ya da dosyaya yazmak yetiyor | Semantik HTML + CSS + vanilla JS + PHP dosya tabanlı mini CMS (Diyetisyen projesi) |
| **V2 — Ayrık API** | Aynı veriyi mobil uygulama ya da üçüncü taraf istemci de kullanacak | Next.js ön yüz + ayrı API (Hono ya da NestJS) + OpenAPI; ADR zorunlu (VetFlow projesi) |

**Alt kararlar** (V1 içinde):

| Konu | Kural |
|---|---|
| Cache Components | Herkese açık içerik ağırlıklıysa **açık** (statik kabuk + akışla gelen dinamik kısım, Revnak). Ekranların çoğu oturum arkasındaysa **kapalı** (Bütçe ADR-0014). |
| Çok dil | Yalnızca ≥ 2 dil istenirse: next-intl + `hreflang`. Tek dilde metinler bileşende ya da `content/` altında; hata kodu → mesaj eşlemesi her durumda tek dosyada. |
| Harita | MapLibre GL + OpenFreeMap (anahtarsız). Yer arama / yorum gerekiyorsa Google Places (anahtar + kota). |
| Ödeme | Türkiye: iyzico ya da PayTR; yurt dışı: Stripe. Demo'da yalnızca test kipi. |
| E-posta | Resend + React Email; alan adı doğrulaması (SPF, DKIM, DMARC) canlıdan önce. |
| SMS / WhatsApp API | Netgsm / İleti Merkezi; WhatsApp Cloud API. Yalnızca canlıda ve müşteri hesabıyla. |
| Dosya depolama | Az ve küçük dosya: Vercel Blob. Çok / büyük ya da özel dosya: Cloudflare R2 (imzalı adres). |
| Arama | PostgreSQL (`pg_trgm` + arama anahtarı kolonu). Meilisearch yalnızca ~10.000+ kayıt ya da yazım hatası toleransı şartsa. |
| Hız sınırı | PostgreSQL tabanlı (ek servis yok). Trafik yüksekse Upstash Redis. |
| Analitik | Çerezsiz: Vercel Web Analytics ya da Plausible / Umami. GA4 + piksel yalnızca reklam ölçümü gerekiyorsa ve çerez onayıyla. |
| Barındırma | Demo / portfolyo: Vercel Hobby. Ticari teslim: Vercel Pro ya da müşteri hesabı; alternatif Docker + VPS ([16 §6](16-ortamlar-ve-yayin.md#6-vercel-ve-barındırma)). |

## 6. K4 — Paket tetikleyicileri

Bir koşul doğruysa ilgili paket **zorunlu** hale gelir; özellik puanlamasına girmez.

| Koşul | Zorunlu paket |
|---|---|
| Kişisel veri toplayan herhangi bir form | Aydınlatma bağlantısı, onay kaydı, spam koruması, yönetim panelinde talep kutusu, işletmeye bildirim (demo'da demo kutusu) |
| Pazarlama iletisi (bülten, kampanya SMS'i) | Ayrı açık rıza kutusu, İYS kontrolü, her iletide çıkış bağlantısı |
| Zorunlu olmayan çerez ya da üçüncü taraf betik | Çerez tercih merkezi, onaydan önce yükleme yok |
| Randevu / rezervasyon | Müsaitlik hesabı, **veritabanı düzeyinde çakışma kısıtı**, `.ics`, iptal / erteleme bağlantısı, hatırlatma (demo kutusu) |
| Ödeme | Mesafeli satış sözleşmesi, ön bilgilendirme, iade / cayma, teslimat koşulları, ETBİS kontrolü, webhook doğrulama ve tekrar güvenliği |
| Hesap modeli C / D | Gizlilik politikası, hesap silme, verilerimi indir, oturum yönetimi |
| Özel nitelikli veri (sağlık, biyometri, sabıka vb.) | Açık rıza, erişim kaydı, en az yetki, sektörel reklam kısıtı notu |
| Katalog ≥ 20 kayıt | URL'ye bağlı filtre ve sıralama, sayfalama SEO kuralı, boş sonuç durumu |
| Birden fazla personel kullanıcısı | Rol / yetki matrisi, işlem geçmişi (audit log) |
| Ziyaretçi içeriği (yorum, soru) | Moderasyon, spam koruması, işletme yanıtı |
| Dosya yükleme | İçerik türü (magic byte) ve boyut denetimi, yeniden kodlama, özel depolama |
| ≥ 2 dil | i18n, `hreflang`, çeviri alanları, dil seçici |
| Yerel işletme | `LocalBusiness` JSON-LD, NAP tutarlılığı, harita / yol tarifi |
| Blog / rehber | `BlogPosting` JSON-LD, kategori sayfaları, iç bağlantı kuralı, [S] RSS |
| Demo (her proje başlangıçta) | `DEMO_MODE`, `noindex`, demo şeridi, demo kutusu, seed + reset komutları |

## 7. K5 ve K6 — Özellik seçimi, öncelik ve bütçe

### 7.1 Etiketler

| Etiket | Kural |
|---|---|
| **[Z]** | Her projede. Puanlanmaz. ([katalog/01-cekirdek](../katalog/01-cekirdek.md)) |
| **[Ö]** | Varsayılan olarak dahil. Çıkarılırsa gerekçe yazılır. |
| **[S]** | Puanlanır (§7.2). |
| **[X]** | Yalnızca ilgili sektörde; puanlanır. |

### 7.2 Puanlama

Her aday özellik beş ölçütle 0 / 1 puanlanır:

| Ölçüt | 1 puan için soru |
|---|---|
| **D** — Değer | Ziyaretçinin ya da işletmenin sık sorduğu bir soruyu cevaplıyor, bir işi kısaltıyor mu? |
| **İ** — İş etkisi | Dönüşümü (talep, randevu, satış) ya da işletmenin verimini doğrudan artırıyor mu? |
| **B** — Sektör beklentisi | Araştırmadaki başarılı rakiplerin çoğunda var mı, yokluğu fark edilir mi? |
| **Y** — Yasal | Mevzuat ya da platform kuralı gerektiriyor mu? (1 ise zorunludur) |
| **G** — Getiri / maliyet | Efor S ya da M ise 1; L ise yalnızca D + İ = 2 olduğunda 1 |

- **Toplam ≥ 2** → aday. Altı → "kapsam dışı" listesine gerekçesiyle.
- **Y = 1** → P0.
- Katalogdaki **varsayılan seviyesi** projenin seviyesinden yüksekse, puanı ≥ 4 olmadıkça P2'ye gider.

### 7.3 Efor

| Efor | Süre | Puan | Kural |
|---|---|---|---|
| S | ≤ 2 saat | 1 | — |
| M | 2–6 saat | 3 | — |
| L | 6+ saat | 6 | Plana girerse dikey dilimlere bölünür; tek dilim en fazla M |

### 7.4 Öncelik ve bütçe

1. **P0** = [Z] + Y=1 + ana dönüşüm akışı (ziyaretçinin siteye geliş amacı).
2. **P1** = puanı ≥ 3 olan adaylar, puan / efor oranına göre sıralanır.
3. Toplam efor (P0 + P1) seviye bütçesini (§3.3) aşarsa en düşük oranlı P1'ler P2'ye iner.
4. **Fark yaratan pay:** Bütçenin yaklaşık %20'si, D = 1 ve B = 0 olan (yani rakiplerde nadir ama gerçekten işe yarayan) özelliklere ayrılır. Bu, "dolu dolu ama süs değil" ilkesinin ölçülebilir hâlidir (Revnak'taki güven kartı, m² fiyatının bölge ortalamasıyla kıyası gibi).
5. **P2** = sonraki faz. Planın §22 bölümüne gerekçesiyle yazılır.

Plandaki özellik tablosu biçimi: `Kod · Özellik · Etiket · D İ B Y G · Puan · Efor · Öncelik · Dilim`.

## 8. K7 — CRM ve süreç yapısı

**Kural:** Ziyaretçi bir talep bırakıyor ve bu talep birden fazla temasla sonuçlanan bir sürece dönüşüyorsa CRM düşünülür. Ölçütler: yüksek değerli ürün / hizmet, uzun karar süresi, birden fazla temas, aynı anda çok sayıda takip edilen aday.

| Durum | Yapı |
|---|---|
| Ölçütlerden en az 2'si, S3+ | Tam CRM: kişi kartı, zaman çizelgesi, Kanban huni, görevler, kayıp nedeni ([katalog/05-crm](../katalog/05-crm.md)) |
| Ölçütlerden 1'i ya da S2 | Hafif CRM: talep kutusunda durum (Yeni → İletişim kuruldu → Sonuçlandı / Kayıp), not, atama |
| Hiçbiri | Talep kutusu (okundu / yanıtlandı) yeterli |

Süreç tipleri: uzun satış (huni), randevu merkezli, sipariş merkezli, başvuru. Aşamalar katalogdaki tablodan alınır, sektöre göre adlandırılır.

## 9. K8 — Yönetim paneli modülleri

| Seviye | Modüller ([katalog/04-yonetim-paneli](../katalog/04-yonetim-paneli.md)) |
|---|---|
| S1 | Giriş, site ayarları (firma bilgisi, iletişim, saatler, sosyal), sayfa metinleri, SSS, galeri, talep kutusu |
| S2 | S1 + özet pano, blog, ekip, hizmetler, yorum moderasyonu, medya kütüphanesi, SEO meta, yasal metinler, (varsa) randevu takvimi, demo kutusu |
| S3 | S2 + katalog yönetimi, CRM, raporlar, rol / yetki, işlem geçmişi, içe / dışa aktarma, bildirim şablonları, 301 yönlendirmeleri |
| S4 | S3 + müşteri / üye yönetimi, sipariş / ödeme / stok, sistem sağlığı, yönetici 2FA zorunlu |

Panel her seviyede mobil uyumludur; telefonda alt sekme çubuğu kullanılır ([13-yonetim-paneli](13-yonetim-paneli.md)).

## 10. Soru politikası (Faz 0)

Soru yalnızca cevabı şu kararlardan birini değiştiriyorsa sorulur: seviye, hesap modeli, teknoloji varyantı, zorunlu paket ya da bir P0 özellik. **En fazla 5 soru**, kısa ve seçenekli. Gerçek müşteri projesinde **marka varlıkları** (logo, kurumsal renk, fotoğrafların orijinal dosyaları) da bu sınıra dahildir; görsel kalite büyük ölçüde onlara bağlıdır.

Cevap yoksa varsayılanlar:

| Konu | Varsayım |
|---|---|
| Firma adı / marka | Kurgusal, sektöre uygun, Türkçe bir ad üretilir ("gösterim amaçlı" notuyla) |
| Bölge | İstanbul; sektöre göre ikinci bir şehir / tatil bölgesi |
| Dil | Yalnızca Türkçe |
| Ödeme | Yok |
| Hesap modeli | §4'teki sorulara göre; şüphede A ya da B |
| Barındırma | Vercel Hobby (demo) |
| Tema | İki adlı konsept önerilir (sektör modülü §10 tohumları, [20 §3](20-gorsel-kalite.md#3-konsept)); biri sektör klişesinden belirgin biçimde ayrışır. Onay özetinde seçilir. |
| İletişim kanalları | Telefon + WhatsApp + form; demo'da gerçek numara kullanılmaz |

## 11. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| KM-01 | Seviyeyi ne belirler | Kilit sinyaller; en yüksek eşleşen en düşük seviyedir | Sezgiye değil gözlenebilir özelliklere dayanır; iki kişi aynı sonuca varır. |
| KM-02 | "Etkileyici olsun" isteği | Seviyeyi yükseltmez; fark yaratan pay (%20) ile karşılanır | Kapsam kaymasının en yaygın nedeni; "dolu dolu" tarz bütçe içinde kalır. |
| KM-03 | Puanlama | 5 ölçüt × 0/1; ≥ 2 aday; Y = 1 zorunlu | Brifteki kural; ikili ölçek tartışmayı kısaltır. |
| KM-04 | L efor | Plana girerse dilimlere bölünür | Tek oturumda bitmeyen iş yarım kalır ve mobil / test adımları atlanır. |
| KM-05 | Hesap varsayılanı | Gerekmiyorsa yok | Dönüşüm ve KVKK yükü. |
| KM-06 | Zaman kutuları | Başlangıç değerleri; derslerle kalibre | Sistem yaşayan bir standarttır. |
| KM-07 | Tasarım konsepti | Karar zincirinin parçası (K10); onayda iki seçenek | nail-art-studio'da tasarım yönü karar zincirinin dışında kaldı ve sektör varsayılanına düştü. **[+]** |

## 12. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | K10 tasarım konsepti; gerçek müşteride marka varlıkları sorusu; tema varsayılanı iki konsept oldu (KM-07). |
