# Yeni mekân eklemek

> REQ-023 · D-21 · İlgili: ADR-0002 (alan adı haritası), ADR-0003 (tema ağaçları), K-50 (panelden kip ve alan adı)

Bir mekân; kayıt dosyası, içerik dosyaları ve bir tema ile yayına girer. Hazır tema **Sade** ile yeni mekân kod yazmadan eklenir. Özel tema isteyen mekân önce kendi temasını alır.

## 1. Mekânı oluşturun

```bash
pnpm mekan:yeni --ad "Kepçe Lokantası" --slug kepce --tur lokanta --tema sade \
  --diller tr,en,ar --alan kepce-lokanta.vercel.app
```

Verilmeyen değerler sorulur:

| Değer | Açıklama |
|---|---|
| `--slug` | Küçük harf, rakam, tire. Mekânın adresi, klasörü ve önbellek etiketi buradan gelir. `platform`, `panel`, `giris`, `hesap` gibi adlar ayrılmıştır. |
| `--tur` | `src/platform/tenant/registry-schema.ts` → `VENUE_KINDS` listesinden. |
| `--diller` | İlki varsayılan dildir. Türkçe her zaman olmalı; Arapça seçilirse sayfa sağdan sola döner. |
| `--alan` | Boş bırakılırsa `{slug}-kartela.vercel.app` önerilir. Ad alınmışsa plan §20'deki K-26 kuralı uygulanır. |

Komut şunları yazar:

- `content/mekanlar/{slug}/`:
  - `mekan.ts` (kayıt),
  - `menu.ts` (bir menü, bir bölüm, bir ürün),
  - `bilgi.ts`,
  - `hikayeler.ts`,
  - `hikayeler/` klasörü.
- Mekânı `content/mekanlar/index.ts` ve `icerik.ts`'e ekler.

Yazmadan önce bütün kaydı şemadan geçirir: aynı slug, aynı alan adı ya da tanınmayan tema varsa durur.

## 2. İçeriği doldurun

- **`menu.ts`:** menüler, bölümler, ürünler, fiyatlar, seçenekler (`src/platform/menu/content.ts` şeması).
  - Yayımlanan her üründe bileşen ve enerji zorunludur (REQ-005, K-24).
  - Fiyat tutarı metin olarak yazılır (`"120"`, `"12,50"`).
- **Görseller:**
  - Unsplash / Pexels adresi, gerçek piksel boyutu, fotoğrafçı ve kaynak sayfası `images`'a yazılır.
  - Her görsel `docs/gorsel-kaynaklari.md`'ye bir satır olarak eklenir.
  - Seçim ölçütleri 20-gorsel-kalite §5'tedir; adayları `pnpm gorsel:kontrol` ile inceleyin.
- **`bilgi.ts`:** tanıtım, adres, saatler, Wi-Fi, SSS, alerjen beyanı.
  - Kurgusal mekânın telefonu geliştiricinin hattıdır.
  - Yayından sonra mekânın sahibi bunları panelde düzenler (Ayarlar).
- **`hikayeler.ts`:** Keşfet hikâyeleri; gövdeler `hikayeler/{slug}.{dil}.md`.

## 3. Yerelde bakın

```bash
pnpm db:seed          # mekânı, ayarlarını ve içeriğini veritabanına yazar
pnpm dev              # http://{slug}.localhost:3020
pnpm check && pnpm test:e2e
```

İçerik veritabanına yalnız menüsü olmayan mekâna yazılır. Dosyayı değiştirdikten sonra yeniden yazmak için `pnpm db:seed --icerik-yenile` kullanın.

## 4. Yayın

1. Değişikliği PR olarak açın. Önizleme kendi Neon dalında tohumlanır; mekân `/m/{slug}/` adresiyle açılır.
2. PR birleşince üretim derlemesi mekânı tohumlar ve alan adı haritasına ekler.
3. Alan adını Vercel'de projeye bağlayın: **Panel → Platform → Mekân yönetimi → mekân → Alan adı ekle**.
   - `VERCEL_API_TOKEN` tanımlıysa panel alan adını kendisi ekler.
   - Tanımlı değilse panelde elle izlenecek adımlar görünür.
4. Mekân sahibini davet edin: **Panel → mekân → Ekip → Ekibe davet**, rol "Sahip".
5. Canlıya almak için: **Mekân yönetimi → Kip: Canlıya al**, ardından yeniden yayın. Robots.txt ve dizine eklenme bir sonraki yayınla açılır (K-50).

## Özel tema

```bash
pnpm tema:yeni --id kepce
```

Sade'yi kopyalar:

- tema modülü: `src/themes/{id}/`,
- rota ağacı: `src/app/tema-{id}/`.

Ardından adları değiştirir ve `THEMES`, ESLint tema sınırları ile `src/themes/meta.ts`'e ekler. Bundan sonra tema kendi tasarımını alır:

- token'lar ve akşam takımı `{id}.css`'te,
- yazı tipi `fonts.ts`'te,
- yuvalar `slots/`'ta (örnek: `src/themes/rakim`).

Bir tema başka temanın klasöründen içe aktarma yapamaz. Rota girişindeki dosyalar paylaşılan CSS ya da yazı tipi içe aktarmaz (K-35).

Mekânı yeni temaya almak için `mekan.ts`'te `theme: "{id}"` yazın; yeni mekânda da `pnpm mekan:yeni --tema {id}` kullanabilirsiniz.
