import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isVenueRoute } from "@/platform/tenant/registry";
import type { Locale } from "@/platform/tenant/registry-schema";
import { getVenueView } from "@/server/menu/venue-view";
import { SadeStyleTile } from "@/themes/sade/style-tile";

/** Sade's style tile on a venue (SCR-007, D-10): a review page, never indexed. */
export const metadata: Metadata = {
  title: "Stil karosu",
  robots: { index: false, follow: false },
};

export default async function SadeStylePage({
  params,
}: {
  params: Promise<{ mekan: string; dil: string }>;
}) {
  const { mekan, dil } = await params;
  if (!isVenueRoute("sade", mekan, dil)) notFound();
  const view = await getVenueView(mekan, dil as Locale);
  if (!view) notFound();
  return <SadeStyleTile venue={view} />;
}
