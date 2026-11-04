---
paths:
  - "src/**/actions.ts"
  - "src/**/queries.ts"
  - "src/app/api/**"
  - "src/server/**"
  - "src/proxy.ts"
---

# Sunucu kodu (eylem, sorgu, route handler düzenlemesinde)

Tam kurallar: docs/standartlar/05-sunucu-ve-api.md, 11-guvenlik.md

- Her yazma eylemi bir sarmalayıcıyla tanımlanır: `publicAction` / `userAction` / `adminAction({ permission })`. Sarmalayıcısız eylem yazılmaz.
- Sıra: Zod doğrulama → oturum → yetki → hız sınırı (herkese açık formlarda) → iş kuralı → veritabanı işlemi → `revalidateTag` → `Result`.
- Eylemler istisna fırlatmaz; `{ ok: false, error: { code } }` döner. `code` = kural numarası (`BR-…`) ya da teknik kod (`validation`, `forbidden`, `notFound`, `conflict`, `rateLimited`).
- Sahiplik: başka kullanıcının / müşterinin kaydına erişim `notFound` döner; testi yazılır.
- Sorgular `import "server-only"` içerir ve yalnızca gereken kolonları seçer; N+1 yok.
- Dış servis çağrısı veritabanı işlemi açıkken yapılmaz; e-posta / SMS / WhatsApp yalnızca `channels` üzerinden (DEMO_MODE'da demo kutusu).
- Route handler yalnızca webhook, cron (`CRON_SECRET`), sağlık, auth, dosya indirme için. Webhook imzası doğrulanır.
- Loglara kişisel veri (ad, e-posta, telefon, mesaj metni) yazılmaz; yalnızca kimlik.
- Gizli bilgi yalnızca `@/lib/env`'den okunur; `process.env` doğrudan kullanılmaz.
