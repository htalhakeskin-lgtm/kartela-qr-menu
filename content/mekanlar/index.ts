import type { VenueRecordInput } from "../../src/platform/tenant/registry-schema";
import ornek from "./_ornek/mekan";
import rakim from "./rakim/mekan";

/**
 * Every venue of the platform (ADR-0002 v2). `pnpm mekan:yeni` adds a line here (D-21).
 * Order does not matter; registry.ts validates the whole list.
 */
export const venueRecords: readonly VenueRecordInput[] = [rakim, ornek];
