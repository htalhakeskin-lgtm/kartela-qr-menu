# Git ve CI

> **Durum:** v1.1 · **Son güncelleme:** 2026-10-23
> **Kararlar:** [Bölüm 10](#10-kararlar)

## 1. Bu belge ne işe yarar

Dal düzenini, commit ve PR kurallarını, yerel kancaları, bağımlılık güncellemelerini ve CI hattını tanımlar. Tek geliştirici + yapay zekâ asistanı düzenine göre yazılmıştır; ekip büyüdüğünde aynen geçerlidir.

## 2. Dal düzeni (GitHub Flow)

- Tek kalıcı dal: `main`. Her zaman derlenir, testleri geçer, yayınlanabilir durumdadır. Uzun ömürlü `develop` / `release` dalı yok.
- Her iş kendi dalında: `{tür}/{kimlik}-{kısa-açıklama}` → `feat/req-012-appointment-form`, `fix/34-mobile-menu-scroll`, `docs/plan-v1-1`.
- Dal ömrü en fazla 2–3 gün; uzayan iş dikey dilimlere bölünür. Henüz açılmaması gereken ekran menüye son parçada bağlanır.
- `main`'e doğrudan push yok (pre-push kancası); dal `main`'in gerisinde kalırsa `rebase` + `push --force-with-lease`.
- Her PR tek commit olarak birleşir (squash); geçmiş doğrusal.

## 3. Commit mesajları

[Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/), İngilizce:

```
feat(appointments): block double booking for the same staff slot

Exclusion constraint added; 23P01 maps to BR-RND-003.

Refs: REQ-014, BR-RND-003
```

| Parça | Kural |
|---|---|
| Tür | `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`, `revert` (`style` yok; biçimi araç uygular) |
| Kapsam | Özellik modülü adı (`appointments`, `listings`, `leads`, `panel`, `seo`, `legal`, `deps`, `deps-dev`); liste `commitlint.config.mjs`'te |
| Özet | Emir kipi, küçük harfle başlar, noktasız, ≤ 72 karakter |
| Gövde | **Neden**; ne yapıldığı farkta görünür |
| Alt bilgi | `Refs: REQ-…, BR-…, SCR-…, ADR-…`; kırıcı değişiklikte `BREAKING CHANGE:` |

Yapay zekâ asistanıyla yazılan commit'lerde araç atıf satırları (`Co-Authored-By`) korunur.

## 4. PR

- Şablon: `.github/pull_request_template.md` ([şablon](../sablonlar/pull_request_template.md)): ne ve neden, referanslar, nasıl test edildi, ekran görüntüleri (360 px + 1280 px), bitti tanımı kutuları.
- Boyut: hedef ≤ 400 satır değişiklik (üretilen dosyalar, migration ve kilit dosyası hariç). Büyükse bölünür.
- **Kendi kendine inceleme:** birleştirmeden önce fark satır satır okunur; yapay zekânın ürettiği kodda özellikle yetki denetimi, hata yolları, gereksiz bağımlılık ve "çalışıyor gibi görünen ama test etmeyen" testler aranır.
- Vercel her PR için önizleme adresi üretir; arayüz değişikliği bu adreste telefonda açılarak denenir.
- Birleştirme: CI yeşil + bitti tanımı kutuları işaretli → squash; squash başlığı commit kuralına uyar.

## 5. Yerel kancalar (Lefthook)

| Kanca | Çalışan | Süre |
|---|---|---|
| `pre-commit` | Eklenen dosyalarda ESLint `--fix` → Prettier (sırayla), gitleaks | Saniyeler |
| `commit-msg` | commitlint | Anlık |
| `pre-push` | `main`'e push'u reddeden betik | Anlık |

Typecheck, test ve build kancada çalışmaz (yavaşlık kanca atlama alışkanlığı doğurur); CI'dadır. Kanca kolaylıktır, yetki kaynağı CI'dır. Yapılandırma: [iskelet/lefthook.yml](../iskelet/lefthook.yml).

## 6. Bağımlılıklar

| Konu | Kural |
|---|---|
| Ekleme | Planda olmayan kütüphane sorulmadan eklenmez. Eklenmeden önce: bakım durumu, lisans (MIT / Apache / BSD / ISC tercih), boyut, aynı işi gören mevcut araç var mı. Gerekçe PR açıklamasında. |
| Sabitleme | `pnpm-lock.yaml` depoda; `packageManager` alanı ile pnpm sürümü sabit; Node sürümü `.nvmrc`. |
| Bekleme süresi | `pnpm-workspace.yaml`: `minimumReleaseAge: 4320` (3 gün). Acil güvenlik düzeltmesi `minimumReleaseAgeExclude` ile tek tek. `create-next-app@latest` birkaç saatlik bir sürümü seçebilir; bu durumda 3 günden eski en yeni sürüme sabitlenir ([iskelet/README](../iskelet/README.md)). Seçilen sürüm `pnpm audit`'ten geçmeden kurulum bitmez: 2026-10-16'da bu kuralla seçilen Next.js 16.4.0'da birkaç gün sonra kritik açıklar duyuruldu (yama 16.4.1). |
| Kurulum betikleri | pnpm 10 bağımlılıkların kurulum betiklerini varsayılan olarak çalıştırmaz. Betiği gerekmeyenler `ignoredBuiltDependencies`'e (sharp, unrs-resolver, esbuild, lefthook), gerçekten gerekenler gerekçesiyle `onlyBuiltDependencies`'e yazılır. |
| Güncelleme | Dependabot haftalık (pazartesi), küçük + yama tek PR'da gruplu, büyük sürüm ayrı; `cooldown` 3 gün (büyük sürüm 7). Güvenlik güncellemesi beklemez. |
| Denetim | CI'da `pnpm audit --audit-level=high`; yüksek / kritik açık birleştirmeyi engeller (geçici muafiyet gerekçe + tarihle). |
| GitHub Actions | Dış eylemler tam commit kimliğiyle sabitlenir (`uses: actions/checkout@<sha> # v5`); Dependabot bunları da günceller. |
| Kaldırma | Kullanılmayan bağımlılık ayda bir taranır ve kaldırılır [Ö]. |

## 7. CI hattı (GitHub Actions)

[iskelet/.github/workflows/ci.yml](../iskelet/.github/workflows/ci.yml). PR ve `main` push'unda:

| İş | Adımlar | Paralel |
|---|---|---|
| `static` | `pnpm install --frozen-lockfile` → `lint` → `typecheck` → `format:check` | ✓ |
| `test` | PostgreSQL servis konteyneri → migration → `pnpm test` (birim + entegrasyon) | ✓ |
| `build` | `pnpm build` (sahte ama geçerli ortam değişkenleriyle); rota boyutları özeti | ✓ |
| `e2e` | build → seed → Playwright (mobil + masaüstü, axe, taşma, görsel kalite, SEO temeli) → hata olursa iz ve ekran görüntüsü yüklenir; ardından Lighthouse CI (`pnpm lighthouse`, aynı derleme) | `build` sonrası |
| `security` | gitleaks (PR commit'leri), `pnpm audit` | ✓ |

- İş akışı izinleri en düşük: `permissions: contents: read`.
- `concurrency` ile aynı dalda yeni push eski çalışmayı iptal eder.
- pnpm deposu ve Playwright tarayıcıları önbelleğe alınır.
- Haftalık zamanlanmış iş: tüm geçmişte gitleaks, tüm tarayıcılarda (WebKit dahil) e2e.
- Gizli bilgi gerektiren adımlar (canlı veritabanı, Vercel) PR'da çalışmaz.
- Yerelde aynı denetimler: `pnpm check` (e2e hariç), `pnpm test:e2e`.

**Migration ve yayın:** Vercel yayını Git entegrasyonuyla olur; canlı migration'ı yayından önce çalıştırma yolu [16 §5](16-ortamlar-ve-yayin.md#5-yayın-akışı)'tedir.

## 8. Sürüm ve etiket

- Anlamsal sürüm: demo süresince `0.x.y`; müşteriye ilk canlı teslim `v1.0.0`.
- Etiket `main` üzerindeki commit'e (`v1.2.0`); GitHub Release notu commit türlerinden üretilir (`feat` → Özellikler, `fix` → Düzeltmeler).
- `CHANGELOG.md` [Ö] S3+; S1–S2'de Release notları yeterli.

## 9. Depo ayarları ve herkese açma

- Squash birleştirme açık, diğerleri kapalı; birleşen dal otomatik silinir.
- Herkese açık depoda kural seti: `main` korumalı, CI zorunlu, force push yasak. Özel depoda GitHub'ın ücretsiz planı kural setini zorlamayabilir; bu durumda `pre-push` kancası ve disiplin yeterlidir.
- Portfolyo için depo herkese açılmadan önce: tüm geçmişte gitleaks, `.env.example` dışında ortam dosyası yok, gerçek kişi / müşteri verisi yok, lisans dosyası (genellikle "Tüm hakları saklıdır" ya da MIT, karar plan §21'de), README'de canlı demo bağlantısı ve ekran görüntüleri.

## 10. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| GC-01 | Dal modeli | GitHub Flow, squash | ERP git.md; tek kişi / küçük ekip için en sade. |
| GC-02 | Commit dili | İngilizce Conventional Commits | ERP K-01; otomatik sürüm notu. |
| GC-03 | Kanca aracı | Lefthook | ERP git.md §8; paralel, tek ikili. |
| GC-04 | Tedarik zinciri | 3 gün bekleme + kurulum betiği izin listesi + SHA ile eylem sabitleme | ERP git.md §9; 2025 paket saldırılarının dersi. |
| GC-05 | Güncelleme aracı | Dependabot | GitHub içinde, ek izin yok. |

## 11. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | e2e işine görsel kalite, SEO temeli ve Lighthouse CI eklendi; kurulumda `pnpm audit` zorunlu. |
