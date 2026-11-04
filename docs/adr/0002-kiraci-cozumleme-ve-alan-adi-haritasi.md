# ADR-0002: Kiracı çözümleme ve alan adı haritası

> **Durum:** Kabul edildi · **Tarih:** 2026-11-04 · **Sürüm 2** (D-01'de güncellendi: çözümleme `proxy.ts`'ten `next.config.ts` yeniden yazma kurallarına taşındı, plan K-39)

## Bağlam

Her istekte hangi mekânın açılacağı belirlenmeli: üretimde alan adına göre, yerelde `{mekan}.localhost:3020` ile, önizlemede `?mekan=` ya da yol önekiyle; tanınmayan alan adında 404. Menü sayfaları statik üretilir ve QR'dan sonra ilk ürün 1,5 sn içinde görünmelidir; bu yüzden çözümleme veritabanına gitmemeli (Neon uykudan uyanırken ilk sorgu saniyeler sürebilir, [12 §4 PF-07](../standartlar/12-performans.md)).

**Sürüm 1'deki karar** (çözümleme `src/proxy.ts`'te) D-01'de Next.js 16.4.3'ün kendi belgesiyle sınandı: *"Proxy defaults to using the Node.js runtime. The `runtime` config option is not available in Proxy files."* Proxy'yi bütün yollara bağlamak, Vercel'de her menü isteğinin CDN önbelleğine ulaşmadan bir fonksiyon çağırması demektir: soğuk başlangıç ve ek gecikme, tam da 1,5 sn ve Lighthouse ≥ 0,95 hedeflerinin bulunduğu sayfalarda.

## Karar

**Çözümleme `next.config.ts` → `rewrites().beforeFiles` kurallarıyla yapılır.** Kurallar derleme anında mekân kaydından (`content/mekanlar/*/mekan.ts` → `src/platform/tenant/registry.ts`) `buildTenantRewrites()` ile üretilir (`src/platform/tenant/rewrites.ts`). Alan adı koşulu `has: [{ type: "host" }]` ile verilir; Vercel bu kuralları fonksiyon çalıştırmadan, yönlendirme katmanında uygular. Hedef adres statik sayfadır; CDN önbelleği aynen çalışır.

`beforeFiles` kuralları **zincirlenir**: bir kural eşleşince sonraki kurallar yeniden yazılmış yola bakar (Next.js belgesi, rewrites → "Good to know"). Kurallar bu yüzden sıralıdır ve mekân kurallarından sonraki her kural `tema-` ile başlayan yolu dışlar:

| Sıra | Koşul | Sonuç |
|---|---|---|
| 1 | Yol `/tema-*` (iç yol dışarıdan istenmiş; özgün yolda bir kez denetlenir) | 404 (BR-KRC-004) |
| 2 | Ana bilgisayar mekânın alan adlarından biri ya da `{slug}.localhost` | `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` → `/tema-{tema}/{slug}/{dosya}`; `/{dil}/…` → `/tema-{tema}/{slug}/{dil}/…`; diğer yollar → varsayılan dil. `/_next/*` ve `/api/*` yeniden yazılmaz |
| 3 | Yol `/m/{slug}/…` (başka bir alan adında) | Aynı ağaca; `X-Robots-Tag: noindex, nofollow` (`headers()`) |
| 4 | `?mekan={slug}` (başka bir alan adında) | `/api/onizleme`: oturumluk `kartela_onizleme` çerezini yazar ve aynı yola parametresiz döner. `?mekan=platform` çerezi siler (boş değer Next.js'te "parametre yok" sayılır) |
| 5 | `kartela_onizleme` çerezi | Adım 2 gibi; `/panel` ve `/m/` hariç |
| 6 | Ana bilgisayar bilinmiyor (yerel, platform, mekân alan adları ve `*.vercel.app` dışında) | 404 |

**`proxy.ts` yalnız panelde kalır** (`matcher: ["/panel", "/panel/:path*"]`): iyimser oturum denetimi ve nonce'lu CSP. Panel zaten dinamiktir.

**Alan adı haritası derleme anındadır.** D-01'de kaynak mekân kaydı dosyalarıdır (`content/mekanlar/index.ts`); D-02 mekânları veritabanına tohumlar, D-19'da platform yöneticisi panelden alan adı bağlar: kayıt `venue_domains`'e yazılır, Vercel API ile projeye alan adı eklenir ve Deploy Hook yeni haritayla yeniden yayın başlatır. `/api/health` haritanın parmak izini döner (`map.version`), yeni yayının yayında olduğu buradan görülür. Fikstür mekânlar (`fixture: true`) üretim derlemesinin haritasına girmez (`VERCEL_ENV=production`).

**Görünüm hatırlama** (Hızlı ↔ Keşfet, D-08) aynı yolla: `kartela_gorunum=kesfet` çerezi koşullu bir kural `/`'i Keşfet rotasına yeniden yazar. Arama motoru çerez taşımadığı için `/` her zaman hızlı menüdür.

## Sonuçlar

- **Olumlu:** Menü isteğinde fonksiyon çağrısı yok; soğuk veritabanı ve soğuk fonksiyon menüyü bekletmez; yerel, önizleme ve üretim aynı kurallarla çalışır; kurallar Next.js'in kendi test aracıyla (`unstable_getResponseFromNextConfig`) birim testinden ve çalışan sunucuda e2e'den geçer.
- **Olumsuz / ödünler:** Yeni alan adı ya da tema değişikliği yeniden yayın ister (~1 dk). Kural sayısı mekân × (dil + dosya + 2) kadar büyür; Vercel'in rota sınırı (2.048) ~100 mekâna kadar rahattır. Yeniden yazılmış istekte rota işleyicisi özgün adresi görür (`/api/onizleme` buna göre yazıldı). Kurallar zincirlendiği için sıra ve `tema-` dışlaması bozulursa yönlendirme kayar: e2e testi bunu yakalar.
- **Yeniden değerlendirme koşulu:** Mekân sayısı ~100'ü aşar ya da alan adı değişiklikleri yeniden yayını beklemeyecek kadar sıklaşırsa: Vercel Edge Config + Edge'de çalışan bir çözümleme katmanı ya da platform düzeyinde çok kiracılı alan adı yönlendirmesi.

## Değerlendirilen alternatifler

| Seçenek | Neden seçilmedi |
|---|---|
| `proxy.ts` ile her istekte çözümleme (sürüm 1) | Next.js 16 proxy'si yalnız Node.js çalışma ortamında; her menü isteği CDN'den önce fonksiyon çağırır |
| Proxy'de her istekte veritabanı sorgusu | Soğuk Neon menü açılışını saniyelerce bekletir |
| Vercel Edge Config (şimdiden) | Ek tedarikçi bağımlılığı ve yerelde farklı davranış; bu ölçekte derleme anı kuralları yeterli |
| `?mekan=` parametresini her istekte taşımak | Önizleme bağlantılarında iç gezinme parametreyi kaybeder; çerez tek seferlik seçimle sorunu çözer |

## Kaynaklar

- Next.js 16.4.3 belgeleri: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (Runtime), `05-config/01-next-config-js/rewrites.md` (`beforeFiles`, `has`, zincirleme), `index.md` (`unstable_getResponseFromNextConfig`)
