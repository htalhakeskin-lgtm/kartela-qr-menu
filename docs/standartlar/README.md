# Standartlar

> **Sistem:** web-proje v1.2.0 · **Son güncelleme:** 2026-10-30

Her projeye `docs/standartlar/` olarak **salt okunur** kopyalanır. Projeye özgü sapma, kopyada değil planda (K- kararı) ya da ADR'de yazılır. Kısa özetleri her projenin `AGENTS.md`'sine gömülen [KURALLAR.md](../KURALLAR.md)'dedir; burası ayrıntı ve gerekçedir.

> Standartlar arasındaki bağlantılar projede de çalışır. `../katalog/`, `../iskelet/`, `../sablonlar/` ve kök dosyalara giden bağlantılar **sistem klasörünü** gösterir (`~/.claude/skills/web-proje/`); projedeki kopyada kırık görünmeleri beklenen durumdur.

| No | Belge | Ne zaman okunur | Karar kodu |
|---|---|---|---|
| 00 | [Karar mantığı](00-karar-mantigi.md) | Plan yazarken: seviye, hesap modeli, varyant, paketler, puanlama, efor, CRM, panel | KM |
| 01 | [Teknoloji yığını](01-teknoloji-yigini.md) | Kurulum, yeni bağımlılık | TY |
| 02 | [Mimari](02-mimari.md) | Klasör, katman, yapılandırma, demo / canlı, render | MM |
| 03 | [Kod stili ve isimlendirme](03-kod.md) | Her kod işi | KD |
| 04 | [Veri ve veritabanı](04-veri.md) | Tablo, migration, seed | VR |
| 05 | [Sunucu eylemleri ve API](05-sunucu-ve-api.md) | Form, eylem, webhook, cron, yükleme | SA |
| 06 | [Arayüz ve tasarım sistemi](06-arayuz.md) | Her ekran / bileşen | AR |
| 07 | [Mobil](07-mobil.md) | Her ekran / bileşen | MB |
| 08 | [Erişilebilirlik](08-erisilebilirlik.md) | Her ekran / bileşen | ER |
| 09 | [SEO](09-seo.md) | Herkese açık sayfa | SEO |
| 10 | [Yasal uyum ve KVKK](10-yasal-ve-kvkk.md) | Form, çerez, üyelik, ödeme, yayın | YS |
| 11 | [Güvenlik](11-guvenlik.md) | Kimlik, yetki, eylem, başlık, gizli bilgi | GV |
| 12 | [Performans](12-performans.md) | Herkese açık sayfa, yeni bağımlılık, görsel | PF |
| 13 | [Yönetim paneli](13-yonetim-paneli.md) | Panel ekranları | AP |
| 14 | [Test](14-test.md) | Her değişiklik | TS |
| 15 | [Git ve CI](15-git-ve-ci.md) | Commit, PR, bağımlılık | GC |
| 16 | [Ortamlar ve yayın](16-ortamlar-ve-yayin.md) | Ortam değişkeni, yayın, demodan canlıya geçiş | OY |
| 17 | [İçerik ve demo verisi](17-icerik-ve-demo-verisi.md) | Seed, metin, görsel | IC |
| 18 | [Dokümantasyon ve numaralandırma](18-dokumantasyon.md) | Belge, numara, ADR, ders | DK |
| 19 | [Portfolyo çıktıları](19-portfolyo.md) | Faz 7 (ekran listesi Faz 2'de) | PO |
| 20 | [Sanat yönetimi ve görsel kalite](20-gorsel-kalite.md) | Konsept (Faz 1–2), görsel seçimi (Faz 3), her arayüz diliminin görsel incelemesi | SY (kararlar), GK (çıta maddeleri) |

## Biçim

Her standart aynı iskeleti izler: durum satırı (sürüm, tarih) → "Bu belge ne işe yarar" → kurallar (tablo ağırlıklı) → **Kararlar** (kod, konu, karar, gerekçe) → değişiklik kaydı.

- **[Z] / [Ö] / [S] / [X]:** zorunlu (her projede) / önerilen (varsayılan dahil, çıkarılırsa gerekçe) / seçmeli (puanlanır) / sektöre özgü (yalnızca ilgili sektörde, puanlanır) — [karar mantığı §7.1](00-karar-mantigi.md#71-etiketler). Koşula bağlı zorunluluklar etiket değil **paket**tir ([K4](00-karar-mantigi.md#6-k4--paket-tetikleyicileri)).
- **S1–S4:** kapsam seviyesi; "S3+" o seviye ve üstü demektir.
- **[+]:** referans projelerde ve brifte olmayan, bu sistemin eklediği kural. Gerekçesi kararlar tablosunda ve [ANALIZ.md](../ANALIZ.md)'dedir.

## Güncelleme

Standartlar projelerden gelen derslerle değişir ([18 §6](18-dokumantasyon.md#6-standartların-güncellenmesi-yaşayan-sistem)). Bir kural değişince: standardın sürümü ve değişiklik kaydı, `KURALLAR.md` (özetse), sistemin [DEGISIKLIK-KAYDI.md](../DEGISIKLIK-KAYDI.md)'si güncellenir. Var olan projeler kendi kopyalarını yalnızca bilinçli bir "sistem güncellemesi" dilimiyle yeniler.
