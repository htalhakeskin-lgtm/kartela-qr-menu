import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoPermission } from "@/components/panel/no-permission";
import { availabilityView } from "@/server/panel/availability";
import { requireVenuePage } from "@/server/panel/session";

import { AvailabilityList } from "./availability-list";

export const metadata: Metadata = { title: "Müsaitlik" };

/** SCR-108: what is in service right now (staff and up), on the phone. */
export default async function AvailabilityPage({ params }: { params: Promise<{ mekan: string }> }) {
  const { mekan } = await params;
  const { venue, allowed } = await requireVenuePage(mekan, "availability.edit");
  if (!allowed) return <NoPermission title="Müsaitlik" />;
  const groups = await availabilityView(venue.slug, new Date());
  if (!groups) notFound();
  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Müsaitlik</h1>
        <p className="mt-1 text-muted-foreground">
          Tükenen ürün ziyaretçi menüsünde hemen soluk görünür ve sona dizilir; gün sonunda (04:00)
          kendiliğinden servise döner.
        </p>
      </header>
      <AvailabilityList venueId={venue.id} groups={groups} />
    </>
  );
}
