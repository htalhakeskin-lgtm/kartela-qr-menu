# Dokümantasyon ve Numaralandırma

> **Durum:** v1.1 · **Son güncelleme:** 2026-10-23
> **Kararlar:** [Bölüm 8](#8-kararlar)

## 1. Bu belge ne işe yarar

Her projede hangi belgelerin bulunacağını, numaralandırma sistemini ve belgelerin nasıl güncel tutulacağını tanımlar. İlke: **belge, yapay zekâ asistanının ve gelecekteki geliştiricinin hafızasıdır**; bir oturumda alınan karar, belgeye yazılmadıysa alınmamış sayılır.

## 2. Belge seti

| Belge | Yer | Seviye | Ne zaman güncellenir |
|---|---|---|---|
| Proje planı | `docs/proje-plani.md` | Tümü | Kapsam, kural ya da karar değişince (önce plan, sonra kod) |
| Araştırma özeti | `docs/arastirma.md` | Tümü | Faz 1; yeni bilgi çıkınca |
| İlerleme | `docs/ilerleme.md` | Tümü | Her dilimin başında (plan) ve sonunda (sonuç, ders) |
| Kalite kapıları | `docs/kalite-kapilari.md` | Tümü | Kurulumda seviyeye göre; Faz 5'te işletilir |
| Standartlar (kopya) | `docs/standartlar/` | Tümü | Projede **salt okunur**; değişiklik sisteme ders olarak gider (§6) |
| ADR | `docs/adr/nnnn-baslik.md` | S3+ sapmada, S4 zorunlu | Mimari karar alındığında; eskisi "yerini aldı" olarak işaretlenir, silinmez |
| Görsel kaynakları | `docs/gorsel-kaynaklari.md` | Tümü | Görsel eklendikçe (rol, orijinal boyut, lisans; [20 §5.4](20-gorsel-kalite.md#54-kayıt)) |
| Tasarım çalışma alanı | `docs/tasarim/` (referans ekran görüntüleri; `adaylar/` ve temas sayfası git dışı) | Tümü | Faz 1–3 ve görsel havuzu yenilenince |
| Admin kılavuzu | `docs/admin-kilavuzu.md` | Tümü (panel varsa) | Panel modülü eklenen her dilimde; canlıda teslim edilir |
| README | `README.md` | Tümü | Kurulum, komut ya da yayın adresi değişince |
| AGENTS.md / CLAUDE.md | Kök | Tümü | Komut, klasör, tuzak değişince |
| Portfolyo | `portfolyo/portfolyo.md` | Tümü | Faz 7 |

Belgeler Türkçe, Markdown; diyagramlar Mermaid (ilişki, akış, durum makinesi) olarak belgenin içinde.

## 3. Numaralandırma

| Önek | Ne | Biçim | Nerede tanımlanır |
|---|---|---|---|
| `Z-`, `V-`, `H-`, `A-`, `C-`, `E-`, `G-`, `U-`, `X-{SEK}-` | Katalog özellik kodu | `V-07`, `X-SAG-03` | [katalog](../katalog/README.md) |
| `REQ-` | Projenin gereksinimi (plandaki özellik satırı) | `REQ-014` | Plan §5 |
| `NFR-` | Fonksiyonel olmayan gereksinim | `NFR-03` | Plan §16 |
| `SCR-` | Ekran | `SCR-012` (site 0xx, panel 1xx, hesap 2xx) | Plan §6 |
| `UC-` | Kullanım akışı | `UC-03` | Plan §7 |
| `BR-{MOD}-` | İş kuralı; aynı zamanda hata kodu | `BR-RND-003` | Plan §9 |
| `P-` | Parametre | `P-04` | Plan §9 |
| `K-` | Plan kararı | `K-07` | Plan §23 |
| `ADR-` | Mimari karar | `ADR-0003` | `docs/adr/` |
| `D-` | Dilim (geliştirme parçası) | `D-05` | `docs/ilerleme.md` |
| `RSK-` | Risk | `RSK-02` | Plan §22 |
| `Q-` | Açık soru | `Q-04` | Plan §22 |

**Modül kısaltmaları** (`{MOD}`): üç harf, Türkçe kavramdan (`RND` randevu, `ILN` ilan, `TLP` talep, `SPR` sipariş, `RZV` rezervasyon, `ODM` ödeme, `HSP` hesap). Liste plan §9'un başında.

**Kurallar:**
- Numara bir kez verilir, tekrar kullanılmaz; kaldırılan öğe "kaldırıldı" diye işaretlenir.
- Numara iz bırakır: commit / PR alt bilgisinde (`Refs:`), kodda (`// BR-RND-003`), test adında, hata kodunda.
- Özellik kodu (katalog) ile gereksinim (`REQ`) ayrıdır: katalog sistemin, `REQ` projenin numarasıdır; plan tablosu ikisini eşler.

## 4. İlerleme dosyası

`docs/ilerleme.md` ([şablon](../sablonlar/ilerleme.md)) her oturumun giriş noktasıdır:
- **Şu an:** aktif dilim, son yapılan, sıradaki adım (yapay zekâ asistanı yeni oturuma buradan başlar).
- **Dilim tablosu:** `D-xx`, kapsadığı `REQ`'ler, durum, tarih.
- **Dilim kaydı:** her dilim için plan (dokunulacak dosyalar, adımlar) ve sonuç (ne bitti, ne kaldı, ders).
- **Kalite kapısı raporu.**
- **Dersler:** projeye özgü ve sisteme taşınacak dersler ayrı işaretlenir.

## 5. ADR

[Şablon](../sablonlar/adr.md): bağlam, seçenekler (en az iki), karar, sonuçlar (olumlu / olumsuz), durum (önerildi / kabul / yerini aldı: ADR-xxxx). Yalnızca geri dönmesi pahalı kararlar ADR olur: veritabanı, kimlik doğrulama, barındırma, ayrık API, ödeme sağlayıcısı, standarttan sapma.

## 6. Standartların güncellenmesi (yaşayan sistem)

- Projedeki `docs/standartlar/` kopyası değiştirilmez; proje kendi sapmasını plan K- kararı ya da ADR ile yazar.
- Projede öğrenilen ve **başka projelere de uyan** ders, `ilerleme.md`'de "Sisteme taşı" diye işaretlenir.
- `/web-proje ders` modu bu dersleri sistemdeki `DERSLER.md`'ye ekler; aynı ders iki projede doğrulanınca ilgili standarda işlenir, standardın sürümü ve sistemin `DEGISIKLIK-KAYDI.md`'si güncellenir.
- Sistem sürümü anlamsal: kural ekleme / değiştirme küçük sürüm, düzeltme yama, yapı değişikliği büyük sürüm. Her plan hangi sistem sürümüyle kurulduğunu başlıkta taşır.

## 7. Yazım

- Belgeler kısa cümle, tablo ve listeyle; "bu belge ne işe yarar" ile başlar.
- Her kural gerekçesiyle (kararlar tablosu) yazılır; gerekçesiz kural tartışmada savunulamaz.
- Dış kaynağa dayanan bilgi bağlantıyla verilir; zamana duyarlı bilgi (fiyat, kota, mevzuat) tarih notuyla.
- Belge içinde başka belgeye bağlantı göreli yol + başlık bağlantısıyla.

## 8. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| DK-01 | Tek doğru kaynak | Proje planı | Brif: "plan anayasadır". |
| DK-02 | Numaralandırma | Önekli, tekrar kullanılmayan numaralar | Bütçe ve ERP'deki izlenebilirlik; kod ↔ belge ↔ test bağlantısı. |
| DK-03 | Oturum hafızası | `ilerleme.md` "Şu an" bölümü | Yapay zekâ asistanı oturumlar arasında bağlam kaybetmez **[+]**. |
| DK-04 | Standart kopyası | Projede salt okunur | Projeler arası tutarlılık; dersler merkezî olarak işlenir. |

## 9. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | `docs/tasarim/` eklendi; admin kılavuzu panel dilimleriyle birlikte yazılır. |
