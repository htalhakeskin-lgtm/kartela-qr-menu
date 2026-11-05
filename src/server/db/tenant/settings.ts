import "server-only";

import { eq } from "drizzle-orm";

import type { VenueInfo } from "@/platform/menu/types";

import type { TenantTx } from "./scope";
import { venueSettings } from "./tables";

/** The venue's information page data (D-11); null when the venue has no settings row. */
export async function loadVenueInfo(tx: TenantTx, venueId: string): Promise<VenueInfo | null> {
  const [row] = await tx
    .select()
    .from(venueSettings)
    .where(eq(venueSettings.venueId, venueId))
    .limit(1);
  if (!row) return null;
  return {
    description: row.seo.description ?? null,
    address: row.contact.address ?? null,
    mapUrl: row.contact.mapUrl ?? null,
    phone: row.contact.phone ?? null,
    whatsapp: row.contact.whatsapp ?? null,
    email: row.contact.email ?? null,
    hours: row.hours,
    wifi: row.wifi,
    faq: row.faq,
    allergenStatement: row.legal.allergenStatement ?? null,
  };
}
