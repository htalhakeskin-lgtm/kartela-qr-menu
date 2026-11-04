import { bigint, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

/**
 * Shared column helpers (04-veri §4–5). The db client uses casing: "snake_case", so
 * TypeScript keys are camelCase and SQL columns are snake_case without explicit names.
 */

/** UUIDv7, generated in the app so the id is known before insert. Not used for ordering. */
export const newId = (): string => uuidv7();

export const id = () => uuid().primaryKey().$defaultFn(newId);

const instant = () => timestamp({ withTimezone: true, mode: "date" });

/** created_at / updated_at — every table. */
export const timestamps = {
  createdAt: instant().notNull().defaultNow(),
  updatedAt: instant()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** created_at only — append-only tables (audit, consent, events). */
export const createdAt = { createdAt: instant().notNull().defaultNow() };

/** Content that can be trashed and restored (30-day bin). */
export const softDelete = { deletedAt: instant() };

/** Master data that is archived instead of deleted. */
export const archivable = { archivedAt: instant() };

/** Optimistic locking for records edited in the panel (S3+, 05-sunucu-ve-api §6). */
export const version = { version: integer().notNull().default(1) };

/** Money in minor units (kuruş). Name the key with a `Minor` suffix: priceMinor → price_minor. */
export const money = () => bigint({ mode: "number" });

export { instant };
