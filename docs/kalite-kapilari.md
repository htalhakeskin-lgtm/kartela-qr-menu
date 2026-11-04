# Kalite Kapıları (Bitti Tanımı)

> **Proje:** Kartela — çok mekânlı QR menü platformu · **Seviye:** S4 · **Ortam:** Demo
> İşaretleme: 2026-11-04 (Faz 3). Ziyaretçi formu ve ziyaretçi kişisel verisi yoktur (plan K-15); ilgili maddeler "n/a (K-15)".
> Kaynak: web-proje/sablonlar/kalite-kapilari.md v1.1

<!-- Kurulumda seviyeye uymayan maddeler silinmez, "n/a (S1)" diye işaretlenir; böylece neyin bilerek atlandığı görünür. Demo'da gereksiz olan maddeler "demo'da n/a" olur. -->

Üç düzey vardır. Bir iş, kendi düzeyinin **ve** altındaki düzeylerin koşullarını karşıladığında biter.

## A. Her commit / PR

- [ ] Başlık Conventional Commits biçiminde ve İngilizce; açıklamada ilgili `REQ` / `BR` / `SCR` / `ADR` numaraları.
- [ ] CI yeşil: lint, typecheck, biçim, testler, build, gizli bilgi taraması.
- [ ] Fark satır satır okundu: unutulmuş `console.log`, yorum satırına alınmış kod, istenmeden eklenmiş dosya yok.
- [ ] Değişikliğin türüne göre gereken test eklendi ([14-test §4](standartlar/14-test.md#4-hangi-değişiklik-hangi-testi-ister)).
- [ ] Şema değişikliği migration ile geldi; migration SQL'i okundu.
- [ ] Arayüz değiştiyse 360 px ve 1280 px ekran görüntüsü PR'a eklendi.
- [ ] Kural kapatma (`eslint-disable`) varsa tek satır ve gerekçeli.

## B. Her dilim (özellik)

- [ ] Kabul kriterlerinin tamamı karşılanıyor.
- [ ] **Dikey:** veri + sunucu + ekran + panel tarafı + test birlikte bitti.
- [ ] **Mobil:** 360, 390, 768, 1280 px'te kontrol edildi; yatay kaydırma yok; dokunma hedefleri ≥ 44 px; mobilde tablo yerine kart.
- [ ] **Görsel:** 1440 ve 390 px ekran görüntüsüne bakılarak görsel inceleme turu yapıldı; GK bulguları kapandı ([20 §7](standartlar/20-gorsel-kalite.md#7-görsel-inceleme-turu)).
- [ ] Yükleniyor, boş ve hata durumları var; form hatasında veri kaybolmuyor.
- [ ] Klavyeyle baştan sona kullanılabiliyor; odak görünür.
- [ ] Yetki ve sahiplik sunucuda denetleniyor (S2+: testli).
- [ ] Kural ihlalleri Türkçe, ne yapılacağını söyleyen mesajla gösteriliyor.
- [ ] Herkese açık sayfaysa: meta, canonical, JSON-LD, sitemap'te yer.
- [ ] Değişen kayıtlar işlem geçmişine yazılıyor (S3+).
- [ ] Seed verisi güncel; demo senaryosu etkileniyorsa e2e testi güncel.
- [ ] Panel modülü eklendiyse admin kılavuzunda (`docs/admin-kilavuzu.md`) bölümü **aynı dilimde** yazıldı; düğme adları ve akışlar koddan doğrulandı (Faz 5'e bırakılmaz).
- [ ] Plan ve ilerleme dosyası güncel.

## C. Sürüm / yayın öncesi

| # | Grup | Madde | Seviye | Nasıl |
|---|---|---|---|---|
| 1 | Mobil | Tüm sayfalar ve panel ekranları 360–1536 px'te yatay kaydırmasız | Tümü | `tests/e2e/responsive.spec.ts` |
| 1 | Mobil | Gerçek bir iPhone ve bir Android cihazda ana akış denendi | S2+ | Elle |
| 1 | Mobil | Panel mobilde alt sekme çubuğuyla kullanılabiliyor | Tümü | Elle + e2e |
| 2 | Yasal | KVKK aydınlatma, çerez politikası, gizlilik, (gerekirse) kullanım koşulları yayında | Tümü | e2e duman |
| 2 | Yasal | Onay verilmeden analitik / piksel betiği yüklenmiyor | Tümü | e2e: ağ istekleri |
| 2 | Yasal | Formlarda aydınlatma bağlantısı; açık rıza kutuları ayrı ve işaretsiz; onay kaydı tutuluyor | n/a (K-15) | — |
| 2 | Yasal | İYS / ticari ileti onayları (varsa) | n/a (pazarlama iletisi yok) | — |
| 2 | Yasal | Fiyat Etiketi: "Fiyatlara KDV dahildir", "Basılı fiyat listesini isteyebilirsiniz", alerjen beyanı her dilde; servis / masa / kuver kalemi tanımlanamıyor; kapı önü ve masa listesi yayındaki bütün ürünleri içeriyor (BR-YSL-001…003) | Projeye özgü | e2e `legal-notes.spec.ts` + birim testi |
| 2 | Yasal | 14 alerjen, bileşen ve enerji her üründe dolu; eksik raporu boş (K-24) | Projeye özgü | Panel raporu + birim testi |
| 2 | Yasal | Yasal metinler hukuki incelemeden geçti | Canlı | Müşteri onayı |
| 3 | SEO | `sitemap.xml`, `robots.txt`, canonical, title / description, OG görselleri (her herkese açık sayfada `og:image`) | Tümü | `tests/e2e/seo.spec.ts` + Rich Results Test |
| 3 | SEO | JSON-LD doğrulandı; kurgusal yorum için `Review` yok | Tümü | Schema doğrulayıcı |
| 3 | SEO | Kırık bağlantı yok; 404 doğru durum kodu | Tümü | Bağlantı tarayıcı |
| 3 | SEO | Demo'da `noindex`; canlıda kaldırıldı | Tümü | Başlık testi |
| 4 | Erişilebilirlik | axe: ciddi / kritik ihlal yok (tüm sayfalar) | Tümü | e2e |
| 4 | Erişilebilirlik | Klavye turu: menü, formlar, diyaloglar, panel | Tümü | Elle |
| 4 | Erişilebilirlik | Kontrast: tüm token çiftleri AA | S2+ | Birim testi |
| 5 | Performans | Lighthouse mobil: Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO = 100 (indekslenen sayfa; demo'da SEO kategorisi yerine tek tek SEO denetimleri) | Tümü | `pnpm lighthouse` (Lighthouse CI) |
| 5 | Performans | Menü sayfaları (her mekân, ortanca koşu): Perf ≥ 0,90 hata / ≥ 0,95 hedef-uyarı (ADR-0006, K-40); ilk ürün adı + fiyatı sunucu HTML'inde; FCP ≤ 1,5 sn hata | Projeye özgü | Lighthouse CI mekân matrisi + `site.spec.ts` |
| 5 | Performans | Mekân başına paket: başka temanın modülü ve yazı tipi pakete / ön yüklemeye girmiyor (ADR-0003, K-35) | Projeye özgü | `bundle-isolation.spec.ts` + `next-font-manifest` denetimi |
| 5 | Performans | Son açılan menü çevrimdışı açılıyor (mekân kapsamlı servis çalışanı) | Projeye özgü | e2e `setOffline` |
| 5 | Performans | Veritabanı uykudayken (soğuk başlangıç) herkese açık sayfa kabuğu beklemeden açılıyor | S2+ | Elle: uzun boşluktan sonra ilk ziyaret |
| 5 | Performans | İlk yük JS: çerçeve tabanı + uygulama payı (herkese açık ≤ 50 KB, panel ≤ 130 KB); taban plana yazılı | S2+ | `pnpm olcum:js` (HTML'deki parçaların gzip toplamı) + `pnpm analyze` |
| 6 | Güvenlik | Güvenlik başlıkları (CSP, HSTS, XFO/frame-ancestors, Referrer-Policy, Permissions-Policy); belirteçli sayfalarda `no-referrer` | Tümü | `tests/e2e/headers.spec.ts` |
| 6 | Güvenlik | Giriş, gizli bölüm şifresi ve istatistik ucunda hız sınırı (honeypot n/a, K-15) | Tümü | Entegrasyon testi |
| 6 | Güvenlik | **Kiracı yalıtımı:** her kiracı tablosunda RLS açık; mekânlar arası okuma / yazma / ilişki sızıntısı 0; önbellek etiketleri mekân önekli (ADR-0004) | S4 | `tests/integration/tenant/` |
| 6 | Güvenlik | Yönetici 2FA: platform yöneticisi ve sahip için canlı kipte zorunlu | S4 | Entegrasyon testi |
| 6 | Güvenlik | Yetki ve sahiplik testleri; panel uçları anonim erişime kapalı | S2+ | Entegrasyon testi |
| 6 | Güvenlik | Depoda gizli bilgi yok (tüm geçmiş) | Tümü | gitleaks |
| 6 | Güvenlik | Yüksek / kritik açıklı bağımlılık yok | Tümü | `pnpm audit` |
| 7 | İşlevsellik | Her form uçtan uca (panel davetleri, gizli bölüm şifresi) | Tümü | e2e |
| 7 | İşlevsellik | Mekân test matrisi: her mekânda duman, ekran görüntüsü karşılaştırması, Lighthouse, görsel kalite; ortak kod değişince bütün mekânlar | Projeye özgü | CI (D-22) |
| 7 | İşlevsellik | Yeni mekân 1 iş günü kabul testi ölçüldü ve `docs/yeni-mekan.md`'ye yazıldı (REQ-035) | Projeye özgü | D-39 kaydı |
| 7 | İşlevsellik | Panel CRUD akışları ve uç durumlar (uzun metin, görselsiz kayıt, boş liste) | Tümü | e2e + elle |
| 8 | Testler | CI yeşil; seviye minimum testleri var; demo senaryosu e2e geçiyor | S3+ | CI |
| 8 | Testler | Plan izlenebilirliği: her P0 / P1 özellik ve P0 ekran bir dilimde ve bitmiş | Tümü | `ilerleme.md` eşleme tablosu |
| 9 | İçerik | Yer tutucu metin yok; görseller ve alt metinler tam; görsel kaynak kaydı var | Tümü | Arama + elle |
| 9 | İçerik | Demo notları yerinde (platform şeridi + mekân kipine göre mekân notu, alt bilgi, yasal metin "örnek" notu); alt bilgide "Created by Talha Keskin"; işletme telefonu `0542 311 58 88` | Demo | Elle |
| 10 | Belgeler | README, `.env.example`, admin kılavuzu, plan ve ilerleme güncel | Tümü | Elle |
| 11 | Yayın | Ortam değişkenleri tam (doğrulama açılışta geçiyor) | Tümü | Uygulama açılışı |
| 11 | Yayın | Alan adı, HTTPS, www / kök yönlendirmesi | Canlı | Elle |
| 11 | Yayın | E-posta alan adı doğrulaması (SPF, DKIM, DMARC) | Canlı | Resend paneli |
| 11 | Yayın | Uptime izleme ve hata izleme kurulu; yedek doğrulandı | Canlı | Elle |
| 11 | Yayın | Search Console ve Bing Webmaster; sitemap gönderildi | Canlı | Elle |
| 12 | Portfolyo | `portfolyo/` çıktıları hazır; panel görüntüleri `pnpm db:reset` sonrası (e2e artığı yok) | Tümü | `pnpm screenshots` + elle |
| 13 | Görsel | Konsept planda tanımlı (§11); stil karosu incelendi | Tümü | Plan + `/stil` ekran görüntüsü |
| 13 | Görsel | Profesyonel görünüm çıtası (GK-01…GK-20) tüm herkese açık sayfalarda; referans panosuyla kıyaslandı | Tümü | Görsel inceleme turu ([20 §7](standartlar/20-gorsel-kalite.md#7-görsel-inceleme-turu)) |
| 13 | Görsel | Görsel keskinliği, kırık görsel yok, görsel tekrarı yok | Tümü | `tests/e2e/gorsel-kalitesi.spec.ts` |
| 13 | Görsel | Her görselin kaynak kaydı var ve kabul ölçütlerini karşılıyor (çözünürlük, seri tutarlılığı) | Tümü | `docs/gorsel-kaynaklari.md` + `pnpm gorsel:kontrol` |

## Rapor

Sonuçlar `docs/ilerleme.md` → "Kalite kapısı raporu" tablosuna yazılır. Kırmızı madde varsa ilgili dilim yeniden açılır.
