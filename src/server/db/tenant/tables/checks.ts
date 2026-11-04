import { type SQL, sql } from "drizzle-orm";
import { type AnyPgColumn, uuid } from "drizzle-orm/pg-core";

import { venues } from "../../schema/venues";

/** Shared column and check helpers of the tenant tables (D-03, D-04). */

const quoted = (values: readonly string[]) => values.map((value) => `'${value}'`).join(", ");
/** A fixed value set inlined into a check constraint (the sets live in src/platform/menu). */
export const list = (values: readonly string[]) => sql.raw(quoted(values));
export const textArray = (values: readonly string[]) => sql.raw(`array[${quoted(values)}]::text[]`);

/**
 * A translated field has a non-blank Turkish text. coalesce matters: a check whose expression is
 * NULL passes, so { "en": "…" } without a "tr" key would otherwise be accepted.
 */
export const hasTurkish = (column: AnyPgColumn): SQL =>
  sql`coalesce(length(trim(${column} ->> 'tr')), 0) > 0`;
export const optionalTurkish = (column: AnyPgColumn): SQL =>
  sql`${column} is null or coalesce(length(trim(${column} ->> 'tr')), 0) > 0`;

export const venueColumn = () =>
  uuid()
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" });
