# Teknoloji Yığını

> **Durum:** v1.1 · **Son güncelleme:** 2026-10-23
> **Kararlar:** [Bölüm 6](#6-kararlar)

## 1. Bu belge ne işe yarar

Her projede tekrar sorulmayan varsayılan araçları, sürüm politikasını ve hangi durumda başka araç seçilebileceğini tanımlar. Varyant seçimi (V0 / V1 / V2) [karar mantığı §5](00-karar-mantigi.md#5-k3--teknoloji-varyantı)'tedir.

## 2. İlkeler

1. **Tek araç, tek iş.** Aynı işi gören iki araç aynı projede bulunmaz.
2. **Sıfır kod değişikliğiyle canlıya geçiş.** Demo ile canlı aynı kodu, aynı veritabanı türünü ve aynı sürücüyü kullanır; fark yalnızca ortam değişkenlerindedir.
3. **Ücretsiz katman yeterli olmalı.** Demo ve portfolyo projeleri ücretli servise ihtiyaç duymadan çalışır.
4. **Taşınabilirlik.** Standart PostgreSQL ve standart Next.js; hiçbir parça tek bir sağlayıcıya kilitlenecek biçimde yazılmaz.
5. **Sapma belgelenir.** Bu tablodan sapan her seçim ADR (S3+) ya da plan K- kararıyla (S1–S2) yazılır.

## 3. Varsayılan yığın (V1)

| Katman | Seçim | Neden | Ne zaman başkası |
|---|---|---|---|
| Çalışma ortamı | Node.js LTS (`.nvmrc`; Next.js 16 en az 20.9 ister) | Vercel ve yerelde aynı sürüm | — |
| Çatı | **Next.js 16** (App Router, Turbopack varsayılan) | Tek kod tabanında SEO'lu sayfalar + sunucu eylemleri + API; Vercel'de ayarsız | V2: ayrı API gerekiyorsa ön yüz yine Next.js |
| Dil | **TypeScript** `strict` (6.x'e sabit; typescript-eslint 7.x'i destekleyince geçiş) | Tip bilgili lint kuralları TS 7'nin programatik API'si olmadan çalışmıyor | — |
| Arayüz | React 19 + React Compiler | Elle `useMemo` / `useCallback` yazma ihtiyacını kaldırır | — |
| Stil | **Tailwind CSS 4** (CSS içinde `@theme`; Turbopack yükleyicisi `@tailwindcss/turbopack`, create-next-app kurar) | Token'lar CSS değişkeni; tema çalışma anında değişir | — |
| Bileşenler | **shadcn/ui** (kaynak kod olarak kopyalanır; Base UI temelli varsayılan) + lucide ikonlar | Erişilebilir temel parçalar, tam özelleştirme | Proje Radix tabanlı kurulmuşsa Radix kalır |
| Form | Varsayılan: `useActionState` + HTML kısıtları; sunucu aynı Zod şemasıyla doğrular, alan hatalarını döner. Çok adımlı / anında doğrulamalı formda React Hook Form + Zod resolver, ilk etkileşimde ayrı parça olarak yüklenir | Şema tek kaynak; ilk yük JS'i bütçede kalır ([12 §4](12-performans.md#4-render-ve-veri)) | — |
| Doğrulama | **Zod 4** | Form, eylem, ortam değişkeni, URL parametresi | — |
| Veritabanı | **PostgreSQL**: canlı ve önizleme **Neon** (Frankfurt), yerelde **Docker** | Standart, taşınabilir; Neon dalları önizlemeye ayrı veritabanı verir | — |
| ORM | **Drizzle ORM** + drizzle-kit (migration) | SQL'e yakın, tipli, sunucusuz ortamda hafif; migration SQL dosyası olarak incelenir | — |
| Veritabanı sürücüsü | `pg` (node-postgres) + Neon'un havuzlu bağlantı adresi | Yerel Docker ve Neon'da **aynı sürücü**; kod değişmez | Edge çalışma ortamı şartsa Neon serverless sürücüsü (ADR) |
| Kimlik doğrulama | **Better Auth** (veritabanında oturum; şema `auth` CLI paketiyle üretilir) | E-posta / şifre, doğrulama, sıfırlama, 2FA, yönetici eklentisi, hız sınırı tek kütüphanede; veri bizde | Değişmez; S1'de yalnızca tek yönetici hesabıyla, kullanıcı yönetimi ekranı olmadan kurulur ([11 §4](11-guvenlik.md#4-kimlik-doğrulama-ve-oturum)) |
| E-posta | Resend + React Email | Ücretsiz katman; şablonlar önizlenebilir bileşen | Müşterinin SMTP'si zorunluysa Nodemailer |
| Harita | MapLibre GL + OpenFreeMap | Anahtarsız, ücretsiz, markaya göre stil | Yer arama / yorum gerekiyorsa Google |
| Animasyon | Motion; [S] Lenis | Bileşen geçişleri, kaydırmayla tetiklenen sahneler | Ağır kaydırma sahnesi gerekiyorsa GSAP (bütçe ölçülerek) |
| Tarih | date-fns + `@date-fns/tz` | Gösterim `Europe/Istanbul`; tarayıcı saat diliminden bağımsız | — |
| Görsel | `next/image`; stok görsel için kaynağın CDN'i (özel loader) | Vercel Hobby'de ayda 5.000 görsel dönüşümü var; dış CDN kotayı harcamaz | — |
| Dosya depolama | Vercel Blob; çok / büyük / özel dosyada Cloudflare R2 | — | — |
| Spam | Honeypot + hız sınırı; gerekirse Cloudflare Turnstile | Görünmez, ücretsiz | — |
| Hız sınırı | PostgreSQL tabanlı küçük yardımcı | Ek servis yok | Yüksek trafikte Upstash Redis |
| Analitik | Çerezsiz: Vercel Web Analytics / Plausible / Umami | Çerez onayı gerektirmeyen ölçüm | Reklam ölçümü şartsa GA4 + onay |
| Hata izleme | [Ö] S3+: Sentry (ücretsiz katman) | Canlı hatayı müşteriden önce görmek | — |
| Test | Vitest + Testing Library; Playwright + `@axe-core/playwright` | — | — |
| Lint / biçim | ESLint (flat config: `eslint-config-next` + typescript-eslint) + Prettier (+ Tailwind eklentisi) | Next.js 16'da `next lint` yok; ESLint doğrudan çalışır | — |
| Paket yöneticisi | **pnpm** (`packageManager` alanıyla sabit) | Kilit dosyası, `minimumReleaseAge`, kurulum betiklerine açık izin | — |
| Git kancaları | Lefthook + commitlint + gitleaks | [15-git-ve-ci](15-git-ve-ci.md) | — |
| CI | GitHub Actions | — | — |
| Konteyner | Docker Compose (yerel PostgreSQL); [S] uygulama imajı (`output: "standalone"`) | Tek komutla yerel kurulum; Vercel dışına taşınabilirlik | — |
| Yayın | Vercel (fonksiyon bölgesi `fra1`, Neon ile aynı bölge) | Önizleme bağlantıları, sıfır sunucu yönetimi | Ticari ve Hobby dışı: Pro ya da VPS + Docker ([16 §6](16-ortamlar-ve-yayin.md#6-vercel-ve-barındırma)) |
| Çok dil | [S] next-intl | — | — |
| Ödeme | Yalnızca ödeme paketi varsa: iyzico / PayTR (TR), Stripe (yurt dışı) | — | — |

## 4. V0 — Hafif yığın

Diyetisyen projesindeki yaklaşım: semantik HTML5, CSS (Flexbox / Grid), vanilla JS, PHP 8 dosya işlemleri, `veriler.json` (yazma kilidiyle), `admin.php`. Kurallar:
- Veri dosyası web kökünün dışında ya da `.htaccess` ile erişime kapalı.
- Yönetici parolası `password_hash` ile saklanır; oturum çerezi `HttpOnly`, `Secure`, `SameSite=Lax`.
- CSRF belirteci, dosya yüklemede tür ve boyut denetimi.
- Mobil, SEO, yasal ve erişilebilirlik standartları aynen geçerlidir.

## 5. Sürüm politikası

- Kurulumda her paketin **o günkü kararlı sürümü** kurulur ve kilit dosyasıyla sabitlenir. Bu belgedeki ana sürümler beklentidir; kurulumda farklıysa plan §10'a not düşülür.
- Yeni sürüm yayımlandıktan sonra bekleme süresi uygulanır (pnpm `minimumReleaseAge`, Dependabot `cooldown`; [15 §6](15-git-ve-ci.md#6-bağımlılıklar)).
- Büyük sürüm güncellemesi ayrı PR'dır; sürüm notları okunur.
- Next.js'in kurduğu `AGENTS.md` bloğu, kurulu sürüme ait belgeleri gösterir (`node_modules/next/dist/docs/`). Next.js API'si konusunda eğitim verisine değil bu belgelere güvenilir.

**Son doğrulanan sürümler** (iskelet bu sürümlerle kurulup lint, typecheck, test, migration, seed, build ve e2e ile denendi, 2026-10-16):

| Paket | Sürüm | Not |
|---|---|---|
| next / eslint-config-next / @next/env | 16.4.0 | 16.4.1–16.4.2 o gün 3 günlük bekleme süresine takıldı |
| react | 19.3 | — |
| typescript | 6.0.3 | typescript-eslint 8.71 en fazla 6.0'ı destekliyor; 7.x bekletilir |
| tailwindcss | 4.3 | — |
| drizzle-orm / drizzle-kit | 0.45 / 0.31 | — |
| zod | 4.6 | `z.stringbool`, `z.url`, `z.flattenError`, `z.prettifyError` |
| better-auth / auth (CLI) | 1.7.7 | CLI eski `@better-auth/cli` değil, `auth` paketi |
| vitest / @playwright/test | 5.0 / 1.64 | — |
| eslint | 9.39 | eslint-config-next 16'nın flat config'i |
| pnpm / Node.js | 10.28 / 22 | Doğrulama Node 22 ile yapıldı; `.nvmrc` 24 (etkin LTS) |

## 6. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| TY-01 | Çatı | Next.js tam yığın | Revnak ve Bütçe'de kanıtlandı; tek dağıtım. VetFlow'daki NestJS + Vite ayrımı ancak dış istemci varsa (V2). |
| TY-02 | ORM | Drizzle | VetFlow'da Prisma kullanıldı; standart Drizzle'dır (sunucusuzda hafif, SQL yakın). |
| TY-03 | Sürücü | `pg` her ortamda | Demo → canlı geçişte kod değişmez ilkesi. |
| TY-04 | Kimlik doğrulama | Better Auth | Brifte "bcrypt + JWT" vardı; JWT oturumu iptal edilemez (VetFlow dersi). Veritabanı oturumu + hazır güvenlik özellikleri. |
| TY-05 | Bileşen kütüphanesi | shadcn/ui | Brif "Radix / shadcn tabanlı" öneriyordu; shadcn/ui'ın güncel varsayılanı izlenir. |
| TY-06 | Paket yöneticisi | pnpm | Revnak npm, VetFlow npm workspaces kullanıyordu; pnpm tedarik zinciri korumaları için seçildi. |
| TY-07 | Analitik | Çerezsiz varsayılan | Çerez onayı yükünü ve KVKK riskini azaltır. |
| TY-08 | Form | `useActionState` + HTML kısıtları varsayılan; RHF + Zod yalnızca karmaşık formda ve ayrı parça | nail-art-studio'da istemci doğrulaması iletişim ve randevu sayfalarını 170 KB bütçesinin üstüne (193–204 KB) çıkardı. |

## 7. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-23 | v1.1 | Form varsayılanı `useActionState` + HTML kısıtları oldu (TY-08). |
