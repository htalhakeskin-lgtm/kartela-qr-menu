# ADR-0002: Kiracı çözümleme ve alan adı haritası

> **Durum:** Önerildi · **Tarih:** 2026-11-04

## Bağlam

Her istekte hangi mekânın açılacağı belirlenmeli: üretimde alan adına göre, yerelde `{mekan}.localhost:3000` ile, önizlemede `?mekan=` ya da yol önekiyle; tanınmayan alan adında platform tanıtım sayfası ya da 404. Menü sayfaları statik üretilir ve QR'dan sonra ilk ürün 1,5 sn içinde görünmelidir; bu yüzden çözümleme veritabanına gitmemeli (Neon uykudan uyanırken ilk sorgu saniyeler sürebilir, [12 §4 PF-07](../standartlar/12-performans.md)).

## Karar

`src/proxy.ts` her isteği şu sırayla çözer ve mekânın tema alt ağacına **yeniden yazar** (yönlendirme değil, ek gidiş-dönüş yok):

| Sıra | Koşul | Sonuç |
|---|---|---|
| 1 | İstek yolu `/tema-*` ile başlıyor (iç yol dışarıdan istenmiş) | 404 |
| 2 | Ana bilgisayar (host) alan adı haritasında | `/{yol}` → `/tema-{tema}/{mekan}/{dil}/{yol}`; dil öneki yoksa varsayılan dil |
| 3 | Geliştirmede `{mekan}.localhost` | Aynı yeniden yazma |
| 4 | Platform ya da önizleme alan adında `?mekan={slug}` | `kartela_onizleme` çerezi yazılır (yalnızca o host, oturumluk) ve parametresiz adrese yönlendirilir; sonraki istekler çerezle 2. adım gibi çözülür. `?mekan=` boş → çerez silinir |
| 5 | Platform ya da önizleme alan adında `/m/{slug}/…` | Yol önekli mod: `/m/{slug}/{yol}` → aynı yeniden yazma; sayfalar `noindex`, canonical mekânın kendi alan adı, servis çalışanı kapsamı `/m/{slug}/` |
| 6 | Platform alan adı, mekân yok | Platform rotaları: `/` tanıtım, `/panel/…` |
| 7 | Hiçbiri | 404 (platform tanıtımına bağlantılı, `noindex`) |

**Alan adı haritası derleme anında üretilir.** Doğru kaynak veritabanıdır (`venue_domains`); `pnpm build` öncesinde `scripts/venues/build-domain-map.ts` haritayı `src/generated/domain-map.json` olarak yazar (veritabanına ulaşılamazsa `content/mekanlar/*/mekan.ts` kayıtlarından). Proxy yalnızca bu JSON'u içe aktarır: sıfır ağ çağrısı, her ortamda aynı davranış. Harita yalnızca `host → { mekan, tema, diller, varsayilanDil }` taşır; kip (demo / canlı) ve ayarlar sayfalarda, etiketli önbellekten okunur (kip değişince yeniden yayın gerekmez).

**Panelden alan adı bağlama:** platform yöneticisi alan adını girer → kayıt `venue_domains`'e "bekliyor" durumunda yazılır → Vercel API ile projeye alan adı eklenir (DNS talimatı panelde gösterilir) → Vercel Deploy Hook yeniden yayın başlatır → yeni harita yayına çıkınca `/api/health` haritanın sürümünü döner ve kayıt "yayında" olur. Tema değişikliği de aynı yoldan geçer (tema bir kod modülüdür, yayınla gelmesi doğaldır).

**Görünüm hatırlama da proxy'dedir:** `kartela_gorunum=kesfet` çerezi varsa `/` isteği Keşfet rotasına yeniden yazılır (ek gidiş-dönüş yok; iki rota da statik ve CDN'de ayrı önbellek girdisi). Arama motoru çerez taşımadığı için `/` her zaman hızlı menüdür.

## Sonuçlar

- **Olumlu:** Çözümleme mikrosaniye düzeyinde; soğuk veritabanı menüyü bekletmez; yerel, önizleme ve üretim aynı kodla çalışır; harita git geçmişinde değil derleme çıktısında (sır içermez).
- **Olumsuz / ödünler:** Yeni alan adı ya da tema değişikliği yeniden yayın ister (~2 dk). Hobby'de günde 100 yayın sınırı bu ölçekte sorun değil.
- **Yeniden değerlendirme koşulu:** Mekân sayısı ~20'yi aşar ya da alan adı değişiklikleri sıklaşırsa harita Vercel Edge Config'e taşınır (proxy aynı arayüzle okur; derleme anı JSON'u yedek olarak kalır).

## Değerlendirilen alternatifler

| Seçenek | Neden seçilmedi |
|---|---|
| Proxy'de her istekte veritabanı sorgusu | Soğuk Neon menü açılışını saniyelerce bekletir; statik sayfanın hız hedefini bozar |
| Proxy'de bellek içi önbellek + süreli veritabanı sorgusu | Soğuk örnekte yine sorgu; Fluid compute örnek sayısı öngörülemez; ilk ziyaretçi bedel öder |
| Vercel Edge Config (şimdiden) | Ek tedarikçi bağımlılığı ve yerelde farklı davranış; bu ölçekte derleme anı haritası yeterli. Yeniden değerlendirme koşulunda geçilir |
| `?mekan=` parametresini her istekte taşımak | Önizleme bağlantılarında iç gezinme parametreyi kaybeder; çerez tek seferlik seçimle sorunu çözer |
