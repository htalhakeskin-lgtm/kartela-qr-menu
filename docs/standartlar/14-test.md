# Test

> **Durum:** v1.2 · **Son güncelleme:** 2026-10-30
> **Kararlar:** [Bölüm 10](#10-kararlar)

## 1. Bu belge ne işe yarar

Hangi testin, hangi araçla, hangi seviyede ve hangi değişiklikte yazılacağını tanımlar. Amaç kapsam oranı değil, **kuralların ve kritik akışların bozulmadığının kanıtıdır.**

## 2. Katmanlar

| Katman | Ne sınanır | Araç | Veritabanı | Ne zaman |
|---|---|---|---|---|
| Statik | Tipler, lint, biçim, yasak API'ler | TypeScript, ESLint, Prettier | — | Editör, commit kancası, CI |
| Birim | `domain/` kuralları ve hesaplamalar, `lib/format`, `lib/money`, slug, uygunluk hesabı | Vitest | Yok | Her commit |
| Entegrasyon | Sunucu eylemleri: doğrulama, yetki, sahiplik, kural kodları, kısıtlar, idempotency, kanal çağrısı | Vitest + gerçek PostgreSQL (Docker / CI servisi) | Gerçek, test başına temiz | CI'da her PR |
| Bileşen | Form davranışı, hata gösterimi, boş / yükleniyor durumları | Vitest + Testing Library | — | CI'da her PR |
| Uçtan uca | Demo senaryosu ve kritik akışlar; masaüstü + mobil | Playwright | Gerçek, seed verisiyle | CI'da her PR (Chromium mobil + masaüstü); yayından önce WebKit dahil |
| Mobil taşma | Tüm rotalar, tüm genişlikler ([07 §10](07-mobil.md#10-otomatik-denetim)) | Playwright | Gerçek | e2e ile |
| Erişilebilirlik | Tüm rotalarda ciddi / kritik ihlal | `@axe-core/playwright` | Gerçek | e2e ile |
| Görsel kalite | Görsel keskinliği, kırık görsel, görsel tekrarı ([20 §8](20-gorsel-kalite.md#8-otomatik-denetimler)) | Playwright (`gorsel-kalitesi.spec.ts`) | Gerçek | e2e ile |
| SEO temeli | Her herkese açık rotada title, description, canonical, `og:image`, tek `h1` | Playwright (`seo.spec.ts`) | Gerçek | e2e ile |
| Lighthouse | Ana şablonlarda performans, erişilebilirlik, en iyi uygulamalar | Lighthouse CI (`pnpm lighthouse`) | Gerçek | CI'da her PR |
| Görsel / portfolyo | Ekran görüntüleri | Playwright | Gerçek | `pnpm screenshots` (elle) |

Dağılım yön göstericidir: hataların çoğu parçaların birleştiği yerde çıktığı için ağırlık **entegrasyon** testlerindedir; birim testleri hesaplama ve kurallarda yoğunlaşır; e2e az ve kritiktir.

## 3. Seviyeye göre en az testler

| Seviye | En az |
|---|---|
| S1 | `lib/format` birim testleri (iskeletle gelir) · her form için bir e2e (gönder → kayıt panelde görünür) · tüm rotalar için mobil taşma + axe · yasal sayfalar ve 404 duman testi · güvenlik başlıkları testi |
| S2 | S1 + her iş kuralı (BR) için birim / entegrasyon testi · panel eylemleri için yetki testi (anonim reddedilir) · demo senaryosu e2e · kontrast testi |
| S3 | S2 + her korumalı eylemde "yanlış rol" ve "başkasının kaydı" testleri · eşzamanlı düzenleme (`conflict`) · migration testi (boş veritabanına baştan uygulanır) · kısıt → kural kodu eşleme testi · içe / dışa aktarma |
| S4 | S3 + ödeme akışı (test kipinde, webhook idempotency dahil) · stok / kontenjan yarış testi · e-posta şablonlarının render testi · yük testi [Ö] (ana sayfa ve arama) |

## 4. Hangi değişiklik hangi testi ister

| Değişiklik | En az bu testler |
|---|---|
| Kısıt kuralı (BR, "olmaz") | İhlal eden ve etmeyen durum; eylemin kural koduyla `fail` döndüğü entegrasyon testi. Veritabanı kısıtıyla da korunuyorsa ihlalin aynı koda çevrildiği test. |
| Hesaplama kuralı (fiyat, süre, uygunluk, puan) | Plandaki örneklerle tablo biçimli birim testi (`it.each`); sınırlar (sıfır, eşitlik, aralık ucu, gün sonu, ay sonu). |
| Durum geçişi | İzinli geçiş, izinsiz başlangıç durumundan ret, iki kez geçiş denemesi (koşullu güncelleme). |
| Yetki / sahiplik | İzinli rol başarılı; diğer roller `forbidden`; başka kullanıcının kaydı `notFound` (varlığı açığa vurmadan). |
| Yeni sunucu eylemi | Başarılı yol, doğrulama hatası (alan hataları dönüyor), yetki, hız sınırı (en az bir eylem için), tekrar gönderim. |
| Yeni herkese açık sayfa | `tests/e2e/routes.ts`'e ekleme (taşma + axe otomatik), meta ve JSON-LD duman testi. |
| Yeni form | e2e: doldur → gönder → teşekkür ekranı → panelde kayıt → demo kutusunda bildirim. Mobil projede. |
| Migration | Boş veritabanına tüm migration'lar + seed çalışır (CI'da her PR). Veri dönüştüren migration için eski veriyle ayrı test. |
| Zamanlanmış iş | Sahte "şimdi" ile doğrudan çağrı, etkisi ve ikinci çalıştırmanın etkisizliği. |
| Ekran | Kullanıcının göreceği davranış: doğrulama mesajı, sunucu hatasının alanda gösterimi, boş ve yükleniyor durumu. |
| Hata düzeltmesi | Önce hatayı üreten test, sonra düzeltme. |
| Biçimlendirme / Türkçe metin işleme | `tr-TR` örnekleriyle birim testi ("İstanbul", "ışık", "1.234,56 ₺"). |

## 5. Yazım kuralları

- Test adı kural numarasıyla başlar ve davranışı söyler: `"BR-RND-003: rejects a second booking for the same staff and time"`.
- Testin üç bölümü görünür: hazırla, çalıştır, doğrula.
- Her test kendi verisini kurar (`build*` yardımcıları: `buildAppointment({ startsAt })`); ortak, değiştirilebilir başlangıç verisine güvenilmez. e2e testleri seed verisini kullanır ve onu değiştiriyorsa kendi kaydını oluşturur.
- **Entegrasyon testi tohuma dayanmaz.** CI veritabanı tohumsuzdur: test, kullandığı referans kaydı (hizmet, ayar satırı, şablon) kendisi oluşturur (`onConflictDoNothing`). Levha'da tohumdaki bir hizmete dayanan test yerelde geçti, yalnızca CI'da düştü (D-049).
- **Sabit değer yerine kaynağı oku.** İçerik sürümü, fiyat, ayar gibi değişebilen değerler testte elle yazılmaz; testin kaynağı (dosyanın ön bilgisi, `site-defaults`) okunur. Levha'da yasal metin 1.1'e geçince "Sürüm 1.0" bekleyen e2e düştü.
- **Tohum ya da içerik değişince tam paket.** Tohum, sürüm ya da paylaşılan içerik değişen PR'da yerelde grep'le seçilmiş alt küme yetmez; tam e2e paketi koşulur (yoğun veri, boş veride saklı arayüz kusurlarını açığa çıkarır).
- **Paralel testlerde temizlik:** testler paralel koşar (Vitest dosyaları, Playwright işçileri). Bu yüzden bir test paylaşılan tabloyu `TRUNCATE` etmez ve başkasının kaydını silmez; yalnızca kendi oluşturduğu kayıtları kimlikleriyle siler (`afterEach`). Çakışabilecek kaynaklar işçiye göre ayrılır: benzersiz e-posta / kod son eki (`testInfo.workerIndex` + rastgele), randevu testinde işçiye özel personel ya da gün (`gün = 7 + workerIndex`). Böylece dışlama kısıtı (23P01) iki testin aynı saati almasıyla düşmez.
- Zaman: alan kodu `now` parametresi alır; testlerde sabit bir an (`2026-03-16T09:00:00+03:00`, Pazartesi). Gün, ay ve yıl sınırları ayrıca sınanır.
- **e2e'de sunucunun saati sahtelenemez.** Tarayıcı saati (`page.clock`) sunucudaki "şimdi"yi değiştirmez. Bu yüzden e2e testi "bugün" ya da "yarın"a bağlı bir sonuç beklemez; en az 7 gün sonrasındaki bir iş gününü seçer ya da beklenen değeri sayfanın kendi gösterdiği veriden okur. nail-art-studio'da bir randevu testi yalnızca gündüz koşulunca düşüyordu: o saatten sonraki boş saatler tükeniyordu.
- Kültür: Vitest `TZ=Europe/Istanbul` ve `LANG=tr_TR.UTF-8` ile çalışır; Playwright `locale: "tr-TR"`, `timezoneId: "Europe/Istanbul"`.
- Seçiciler: `getByRole`, `getByLabel`, `getByText`; `data-testid` yalnızca başka yol yoksa. CSS sınıfıyla seçim yapılmaz.
- Sabit bekleme (`waitForTimeout`) yok; Playwright'ın otomatik beklemesi ve `expect(...).toBeVisible()`.
- Dış servisler (e-posta, SMS, ödeme) testte demo kutusuna yazar; doğrulama demo kutusundan yapılır. Ağ çağrısı gerekiyorsa MSW ile.

## 6. Entegrasyon testi kurulumu

- Yerelde `docker compose up -d` ile gelen PostgreSQL'de ayrı `*_test` veritabanı; CI'da servis konteyneri.
- Test başlangıcında migration'lar uygulanır. Her test kendi işlemi içinde çalışır ve geri alınır; işlem kullanılamıyorsa yalnızca kendi kayıtlarını siler. Toplu `TRUNCATE` yalnızca tüm koşunun başında, tek bir global kurulum adımında yapılır (Vitest `globalSetup`).
- Sunucu eylemi doğrudan çağrılır; oturum sahte bağlamla verilir (`withSession({ role: "staff" })`).

## 7. Kararsız testler

- Birim ve entegrasyon testleri tekrar edilmez; düşen test gerçek sorundur.
- e2e CI'da en fazla 1 tekrar; tekrarla geçen test raporda "kararsız" görünür ve issue açılır.
- Kararsız test ya hemen düzeltilir ya da `test.fixme` + issue numarasıyla en fazla 2 hafta karantinaya alınır.

## 8. Hız hedefleri

| Katman | Hedef |
|---|---|
| Birim (tümü) | < 30 sn |
| Entegrasyon (tümü) | < 3 dk |
| e2e (PR'daki set) | < 6 dk |
| PR hattının tamamı | < 10 dk |

## 9. Kod kapsamı

Kapsam ölçülür ve CI özetinde görünür ama **birleştirmeyi engelleyen bir eşik değildir**. Yerine iki kapı vardır: §4 matrisi ve kural izlenebilirliği (plandaki her BR için en az bir test; test adındaki numarayla aranır). `domain/` klasörlerinde %90 üstü beklenir.

## 10. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| TS-01 | Ağırlık | Entegrasyon ağırlıklı | ERP testing.md; hatalar birleşim yerlerinde. |
| TS-02 | Veritabanı | Gerçek PostgreSQL, sahte nesne yok | Kısıtlar ve dışlama kısıtı ancak gerçek veritabanında sınanır. |
| TS-03 | Mobil | Her e2e'de mobil proje + taşma testi | Mobil [Z]. |
| TS-04 | Kapsam eşiği | Yok; matris + izlenebilirlik | Oran hedefi anlamsız test üretir. |
| TS-05 | Kültür | Testler `tr-TR` ve `Europe/Istanbul` | Türkçe harf ve saat dilimi hatalarını yakalayan son katman. |
| TS-06 | Paralel temizlik | Test yalnızca kendi kaydını siler; çakışan kaynak işçiye göre ayrılır | nail-art-studio derslerinin en etkili önerilerinden biri; ortak temizlik paralel koşuda başka testin verisini silebilir, ortak kaynak (aynı personel + saat) kısıt hatası üretir. |
| TS-07 | e2e ve zaman | "Bugün"e bağlı beklenti yok | Sunucu saati sahtelenemez; nail-art-studio'da gündüz düşen randevu testi. |
| TS-08 | Tohumsuz entegrasyon | Test referans kaydını kendisi kurar | CI veritabanı boş; Levha'da yalnızca CI'da düşen test (D-049). |
| TS-09 | Değişen değerler | Kaynaktan okunur; tohum / içerik değişince tam e2e | Levha'da sabit sürüm beklentisi ve yoğun veriyle görünen takvim kusuru (D-047). |

## 11. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | Paralel temizlik ve e2e zaman kuralları (TS-06, TS-07); görsel kalite, SEO ve Lighthouse katmanları. |
| 2026-10-30 | v1.2 | Tohumsuz entegrasyon (TS-08); değişen değerler kaynaktan, tohum değişince tam paket (TS-09). |
