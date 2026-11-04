---
paths:
  - "src/app/*site*/**"
  - "content/**"
---

# Herkese açık sayfalar (sayfa ve içerik düzenlemesinde)

<!-- `*site*` deseni `(site)` rota grubunu kapsar; parantez glob'da grup sözdizimi olduğu için doğrudan yazılmadı. -->

Tam kurallar: docs/standartlar/09-seo.md, 10-yasal-ve-kvkk.md, 12-performans.md, 17-icerik-ve-demo-verisi.md

- Her sayfa `generateMetadata` ile title (site son ekiyle birlikte ≤ 60 karakter), description (≤ 160), canonical ve Open Graph verir.
- Sayfada tek `h1`; başlıklar sırayla. Breadcrumb hem görünür hem `BreadcrumbList` JSON-LD.
- JSON-LD yalnızca sayfada görünen bilgiyle; kurgusal yorumla `Review` / `AggregateRating` yok.
- Yeni dinamik sayfa türü `sitemap.ts`'e eklenir; filtre kombinasyonları ve teşekkür sayfaları `noindex`.
- Belirteç ya da imza taşıyan sayfa (takip, yönetim, çıkış bağlantısı): `noindex` + `next.config`'te `Referrer-Policy: no-referrer` + canlı robots'ta `Disallow`; `headers.spec.ts`'teki `TOKEN_PATHS`'e eklenir.
- Statik / önbellekli üretim varsayılan; istek başına dinamik yalnızca gerekirse.
- Kişisel veri alan form: aydınlatma bağlantısı, ayrı ve işaretsiz rıza kutuları, honeypot, hız sınırı.
- Metin: Türkçe, "siz" dili, somut; lorem ipsum yok; kurgusal içerik demo notuyla.
- Görseller: alt metin anlamlı; dekoratifse `alt=""`. Kaynağı `docs/gorsel-kaynaklari.md`'ye yazılır; seçim ölçütleri (çözünürlük, seri tutarlılığı) 20-gorsel-kalite §5'tedir.
- Demo notu yalnızca şerit, alt bilgi ve yasal metinde; sayfa içine "örnek numara", "(örnek adres)" yazma. İşletme telefonu ve WhatsApp `0542 311 58 88`; alt bilgide "Created by Talha Keskin" (`SiteCredit`).
- İstek anında veritabanına giden bölüm `Suspense` içinde, anlamlı yedekle; soğuk veritabanı sayfayı bekletmez.
