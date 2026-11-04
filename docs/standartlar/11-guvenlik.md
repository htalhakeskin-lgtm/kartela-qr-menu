# Güvenlik

> **Durum:** v1.1 · **Son güncelleme:** 2026-10-30
> **Kararlar:** [Bölüm 13](#13-kararlar)

## 1. Bu belge ne işe yarar

Kimlik doğrulama, yetki, girdi / çıktı güvenliği, güvenlik başlıkları, hız sınırı, gizli bilgi ve yedekleme kurallarını tanımlar. OWASP Top 10 riskleri bu maddelerle karşılanır.

## 2. İlkeler

1. **Varsayılan kapalı.** Yeni uç, eylem ya da sayfa açıkça izin verilmedikçe yalnızca yetkili kullanıcıya açıktır.
2. **Sunucu karar verir.** Arayüzde gizlenen düğme güvenlik değildir; her yetki sunucuda denetlenir.
3. **En az yetki, en az veri.** Rol yalnızca gereken izinleri, sorgu yalnızca gereken kolonları, form yalnızca gereken alanları alır.
4. **Testsiz yetki kodu yoktur.** Yetki, sahiplik ve ödeme kodu değişikliği testle gelir.

## 3. Risk → önlem özeti

| Risk | Önlem | Ayrıntı |
|---|---|---|
| Başkasının kaydına erişim (IDOR) | Sorguda sahiplik filtresi + test | [§5](#5-yetki-ve-sahiplik) |
| Kırık kimlik doğrulama | Better Auth, veritabanı oturumu, hız sınırı, 2FA | [§4](#4-kimlik-doğrulama-ve-oturum) |
| Enjeksiyon | Drizzle parametreli sorgu; ham SQL yalnızca `sql` şablonuyla | [§6](#6-girdi-ve-çıktı) |
| XSS | React kaçışı, zengin metin sunucuda temizlenir, CSP | [§6](#6-girdi-ve-çıktı), [§8](#8-güvenlik-başlıkları) |
| CSRF | Sunucu eylemlerinin köken denetimi, `SameSite=Lax`, değiştiren route handler'da köken denetimi | [§7](#7-csrf-ve-yönlendirme) |
| Kaba kuvvet, spam | Hız sınırı, honeypot, Turnstile | [§9](#9-hız-sınırı-ve-kötüye-kullanım) |
| Gizli bilgi sızıntısı | `env.ts`, gitleaks, istemciye açılan değişken ayrımı | [§10](#10-gizli-bilgiler) |
| Tedarik zinciri | Kilit dosyası, bekleme süresi, kurulum betiği izni, denetim | [15 §6](15-git-ve-ci.md#6-bağımlılıklar) |
| Zararlı dosya | Tür / boyut / içerik denetimi, doğrudan depoya yükleme | [05 §9](05-sunucu-ve-api.md#9-dosya-yükleme) |

## 4. Kimlik doğrulama ve oturum

**Kütüphane:** Better Auth, oturumlar veritabanında. JWT tabanlı oturum kullanılmaz (çıkış ve yetki değişikliğinde anında iptal edilemez).

| Konu | Kural |
|---|---|
| Panel hesabı | Yönetici davetle oluşturulur; açık kayıt yok. S1'de seed'den gelen tek yönetici, kullanıcı yönetimi ekranı yok; aynı kod S2+'da çok kullanıcıya genişler. |
| Üye hesabı [C/D] | E-posta + parola ya da e-postayla giriş bağlantısı / kodu; e-posta doğrulaması zorunlu. Sosyal giriş [Ö]. |
| Parola | Yalnızca parolayla girişte **en az 15 karakter**; 2FA açık hesapta en az 8. En az 64 karakter kabul edilir; karakter türü zorunluluğu ve periyodik değiştirme yok; sızdırılmış parola listesine karşı denetim (HIBP, k-anonimlik). Yapıştırma ve parola yöneticisi serbest. |
| 2FA | Panelde TOTP: S3+ [Z], S2 [Ö]. Yedek kodlar tek kullanımlık. |
| Oturum çerezi | `HttpOnly`, `Secure`, `SameSite=Lax`, `__Secure-` önekli. |
| Oturum süresi | Panel: 12 saat hareketsizlik / 7 gün mutlak. Üye: 30 gün kayan. |
| İptal | Parola değişikliği, rol değişikliği ve hesap kapatmada tüm oturumlar düşer. [Ö] "Aktif oturumlar" ekranı. |
| Giriş hatası | Genel mesaj: "E-posta ya da parola hatalı." Hesabın var olup olmadığı açığa çıkmaz. |
| Kilitleme | Kalıcı kilit yok; artan bekleme + hız sınırı (hesap ve IP bazında). |
| Parola sıfırlama | Tek kullanımlık, 30 dakika geçerli bağlantı; yanıt her durumda aynı ("Hesap varsa e-posta gönderildi"); sıfırlama sonrası tüm oturumlar düşer. |
| Kayıt olayları | Giriş başarılı / başarısız, parola ve 2FA değişikliği, rol değişikliği `audit_logs`'a (IP karması ile). |
| Demo | Giriş ekranında yalnızca demo hesabının bilgisi gösterilir; demo hesabı parolasını değiştiremez, kullanıcı ekleyemez. |

## 5. Yetki ve sahiplik

- İzinler `src/config/permissions.ts`'te kod olarak: rol → izin kodu listesi (`appointments.view`, `appointments.confirm`, `settings.edit`). Varsayılan roller: `owner`, `admin`, `staff` (sektöre göre plan §8'de genişler).
- `adminAction({ permission: "appointments.confirm" })` izni denetler; sayfalar `requirePermission()` ile korunur; menü öğeleri izne göre gizlenir (yalnızca kolaylık).
- **Sahiplik:** üye verisi sorgusu her zaman `where user_id = session.userId` içerir; kimlik URL'den gelse bile. Personel yalnızca kendi kayıtlarını görüyorsa (ör. kendi randevuları) aynı kural.
- Herkese açık kod ile erişilen kayıtlar (randevu yönetim bağlantısı, sipariş takibi) tahmin edilemez belirteç kullanır (en az 128 bit), sıralı numara değil.
- Testler: her korumalı eylem için "yetkisiz rol reddedilir" ve "başkasının kaydı reddedilir" senaryoları ([14 §4](14-test.md#4-hangi-değişiklik-hangi-testi-ister)).

## 6. Girdi ve çıktı

- Her girdi Zod ile doğrulanır ([05 §5](05-sunucu-ve-api.md#5-doğrulama)); fazladan alanlar atılır (`strict` ya da seçerek okuma).
- Veritabanı erişimi Drizzle sorgu kurucusu ile; ham SQL gerekirse yalnızca `sql` etiketli şablonla (parametreli). Dize birleştirerek SQL yazılmaz.
- React çıktıyı kaçışlar. Zengin metin (blog, hizmet açıklaması) **kaydederken** sunucuda izin listesiyle temizlenir ve `<SafeHtml>` ile basılır.
- Kullanıcının girdiği bağlantılar yalnızca `http:` / `https:`; dış bağlantılara `rel="noopener noreferrer"` (kullanıcı içeriğinde ek olarak `ugc nofollow`).
- JSON-LD basılırken `<` karakteri kaçışlanır (`<`).
- Hata mesajları ve loglar yığın izi, SQL ya da iç yol göstermez (kullanıcıya).

## 7. CSRF ve yönlendirme

- Sunucu eylemleri Next.js'in köken denetimiyle korunur; `serverActions.allowedOrigins` yalnızca gerçekten gerekiyorsa genişletilir.
- Durum değiştiren route handler (`POST`, `PUT`, `DELETE`) `Origin` başlığını denetler; webhook'lar imzayla korunur.
- Girişten sonraki dönüş adresi yalnızca **göreli yol** olabilir (`/panel/...`); tam URL kabul edilmez (açık yönlendirme).

## 8. Güvenlik başlıkları

`next.config.ts` `headers()` ile tüm yanıtlara ([iskelet](../iskelet/next.config.ts)):

| Başlık | Değer |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (canlıda; `preload` alan adı sahibinin onayıyla) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` (gereken açılır, ör. "yakınımdakiler" için `geolocation=(self)`) |
| `X-Frame-Options` + CSP `frame-ancestors` | `DENY` / `'none'` |
| `Cross-Origin-Opener-Policy` | `same-origin` (ödeme açılır penceresi varsa `same-origin-allow-popups`) |
| `Content-Security-Policy` | Aşağıda |

**CSP iki katmanlı:**
- **Herkese açık sayfalar (statik / önbellekli):** nonce'suz politika. `default-src 'self'`; `script-src 'self' 'unsafe-inline'` + izinli alanlar; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `img-src`, `connect-src`, `frame-src` yalnızca kullanılan sağlayıcılar; `upgrade-insecure-requests`. Nonce statik render'ı bozacağı için burada kullanılmaz; XSS'e karşı asıl savunma kaçış + temizlemedir.
- **Panel ve hesap (zaten dinamik):** `proxy.ts` her istekte nonce üretir; `script-src 'self' 'nonce-…' 'strict-dynamic'`, `'unsafe-inline'` yok.
- Yeni üçüncü taraf eklenince CSP izin listesi aynı PR'da güncellenir; önce `Content-Security-Policy-Report-Only` ile denenir.

**Belirteçli ve imzalı sayfalar:** adreste belirteç ya da imza taşıyan her yol (takip, randevu yönetimi, e-postadaki çıkış / onay bağlantısı, davet ve parola bağlantısı) `next.config` başlıklarında `Referrer-Policy: no-referrer` alır; sayfanın meta etiketi tek başına yetmez. Ayrıntı ve robots kuralı [09 §3](09-seo.md#3-teknik-seo).

**Test:** başlıklar `tests/e2e/headers.spec.ts` ile denetlenir ([iskelet](../iskelet/tests/e2e/headers.spec.ts)): herkese açık sayfada HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `eval`'sız CSP ve `X-Powered-By` yokluğu; panelde istek başına değişen nonce, `strict-dynamic` ve `X-Robots-Tag`; belirteçli yollarda `no-referrer`; demo'da `noindex`. Levha'da başlıklar yapılandırılmıştı ama test yoktu; Faz 5'te yazılınca iki belirteçli yolda başlığın eksik olduğu görüldü (D-046, D-050).

## 9. Hız sınırı ve kötüye kullanım

Varsayılanlar `src/config/limits.ts`'te (P- numaralarıyla); `action_rate_limits` tablosunda sabit pencere sayacı (giriş denemeleri Better Auth'un kendi sınırlayıcısında):

| Eylem | Sınır | Anahtar |
|---|---|---|
| Giriş | 5 / 15 dk | IP + e-posta |
| Parola sıfırlama isteği | 3 / saat | IP + e-posta |
| İletişim / teklif / randevu formu | 5 / 10 dk | IP |
| Bülten kaydı | 3 / saat | IP |
| Arama, filtre (herkese açık) | 60 / dk | IP |
| Dosya yükleme (panel) | 30 / 10 dk | Kullanıcı |

- Her herkese açık formda honeypot alanı ve "gönderim süresi" denetimi (1,5 saniyeden hızlı dolan form şüpheli). Bot trafiği görülürse Cloudflare Turnstile eklenir (CSP ve çerez politikası güncellenir).
- Formdan tetiklenen e-posta / SMS yalnızca kayıtlı alıcıya ya da doğrulanmış adrese gider; formla rastgele adrese mesaj attırılamaz.
- IP, Vercel'in güvenilir başlığından alınır; kullanıcı kontrolündeki `X-Forwarded-For` ilk değeri körlemesine kullanılmaz.

## 10. Gizli bilgiler

- Tüm yapılandırma `src/lib/env.ts` ile açılışta Zod'la doğrulanır; eksik değişkende uygulama açılmaz ([iskelet](../iskelet/src/lib/env.ts)).
- `NEXT_PUBLIC_` önekli değişken gizli olamaz; istemciye açılanlar ayrı dosyadadır (`public-env.ts`), sunucu yapılandırması `server-only` korumalı `env.ts`'tedir. `.env` dosyasındaki boş değer tanımsız sayılır.
- `.env.example` her değişkeni açıklamasıyla listeler; gerçek değer içermez.
- Depo: gitleaks hem commit kancasında hem CI'da. Sızan anahtar **önce iptal edilir / değiştirilir**, sonra geçmiş temizlenir.
- Üretim ve önizleme ortamları ayrı anahtar ve ayrı veritabanı dalı kullanır.

## 11. Loglama ve izleme

- Yapılandırılmış log (JSON): `level`, `msg`, `requestId`, `userId` (varsa), `errorId`. Kişisel veri ve gizli bilgi yazılmaz; e-posta / telefon maskelenir.
- Güvenlik olayları `audit_logs`'a: giriş, yetki reddi, rol değişikliği, toplu silme, dışa aktarma.
- S3+ canlıda Sentry: kişisel veri gönderimi kapalı (`sendDefaultPii: false`), oturum tekrar kaydı kapalı ya da maskeli.

## 12. Yedek ve geri dönüş

- Neon'un zamana göre geri yükleme penceresi plana göre değişir; canlı S3+ projede ek olarak günlük `pg_dump` yedeği ayrı bir depoya şifreli alınır ve ayda bir geri yükleme denenir.
- Yüklenen dosyalar için depolama sağlayıcısının sürümleme / yaşam döngüsü ayarı açık.
- Geri yükleme adımları `docs/` altında yazılı (runbook) ve teslim belgesinde.

## 13. Kararlar

| No | Konu | Karar | Gerekçe |
|---|---|---|---|
| GV-01 | Oturum | Better Auth + veritabanı oturumu; S1'de bile tek yönetici hesabı | VetFlow, JWT'nin iptal edilemediğini görüp opak refresh token + rotasyon kodunu elle yazmıştı; Revnak (K20) paneli tek parola + imzalı JWT çerezle koruyordu. İkisi de kütüphanenin hazır verdiği işi elle yapıyordu ve çok kullanıcıya geçişte yeniden yazım gerektiriyordu. |
| GV-02 | Parola uzunluğu | Tek faktörde 15, 2FA ile 8 | Referans projede 10 karakter + karmaşıklık kuralı vardı; güncel NIST SP 800-63B (rev. 4) uzunluğu ve sızıntı denetimini öne çıkarıyor. |
| GV-03 | CSP | Herkese açık sayfada nonce'suz, panelde nonce'lu | Nonce tüm sayfaları dinamik render'a zorlar; vitrin sayfalarının hızı ile panelin sıkı korunması dengelendi. |
| GV-04 | Hız sınırı deposu | PostgreSQL | Ek servis yok; trafik büyürse Redis. |
| GV-05 | Kilitleme | Kalıcı kilit yok, artan bekleme | Kalıcı kilit saldırgana hesabı kilitleme aracı verir. |
| GV-06 | Başlık testi | İskelette `headers.spec.ts` | Yapılandırılmış ama denetlenmeyen başlık sessizce eksik kalır (Levha D-046). |

## 14. Değişiklik kaydı

| Tarih | Sürüm | Değişiklik |
|---|---|---|
| 2026-10-16 | v1.0 | İlk sürüm. |
| 2026-10-30 | v1.1 | Belirteçli sayfalarda `no-referrer` başlığı; `headers.spec.ts` (GV-06). |
