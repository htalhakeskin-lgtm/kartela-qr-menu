---
paths:
  - "src/server/db/**"
  - "drizzle/**"
  - "scripts/**"
  - "drizzle.config.ts"
---

# Veri katmanı (şema, migration, seed düzenlemesinde)

Tam kurallar: docs/standartlar/04-veri.md, 17-icerik-ve-demo-verisi.md

- Tablo adları çoğul snake_case; TS tarafı camelCase (Drizzle `casing: "snake_case"`).
- Kimlik: uygulamada üretilen UUIDv7 (`newId()`); ardışık sayı dışarı açılmaz.
- Para: kuruş cinsinden `bigint` (`*_minor`) + gerekiyorsa `currency`; `numeric`/`real` yok.
- An: `timestamptz` (UTC); takvim günü: `date`; telefon: E.164 metin.
- Her tabloda `created_at`, `updated_at`; panelden düzenlenen kök kayıtlarda `version` (S3+).
- Silme politikası: içerik → `deleted_at` (çöp kutusu); ana veri → `archived_at`; kişisel veri → saklama süresi sonunda gerçek silme / anonimleştirme.
- Sabit değer kümeleri: `text` + `check` kısıtı (pgEnum değil).
- Yarış durumuna açık kurallar veritabanında da korunur: benzersizlik, `check`, randevu için `EXCLUDE USING gist` (özel SQL migration).
- Sorgulanan her yabancı anahtar ve filtre kolonunda indeks.
- Migration: `pnpm db:generate` → SQL'i oku → `pnpm db:migrate`. Canlıda `push` yok. Uygulanmış migration değiştirilmez.
- Seed: Türkçe, gerçekçi, belirlenimci (sabit tohum), uç durumlu; kurgusal olduğu açık; `pnpm db:reset` ile tekrarlanabilir.
