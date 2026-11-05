import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { getVenueView } from "@/server/menu/venue-view";
import { RakimStyleTile } from "@/themes/rakim/client";

/** Rakım's style tile (SCR-007, D-14): a review page, never indexed. */
export const metadata: Metadata = {
  title: "Stil karosu",
  robots: { index: false, follow: false },
};

export default async function RakimStylePage({
  params,
}: {
  params: Promise<{ mekan: string; dil: string }>;
}) {
  const { mekan, dil } = await params;
  if (!isVenueRoute("rakim", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  return <RakimStyleTile venue={view} />;
}
