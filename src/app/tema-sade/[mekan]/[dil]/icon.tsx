import { ICON_SIZE, venueIcon } from "@/platform/routes/venue-images";
import { themeLocaleParams } from "@/platform/tenant/registry";

// Theme tree favicon (ADR-0003): the venue's initial on Sade's primary colour.
export const size = ICON_SIZE;
export const contentType = "image/png";

/** Drawn at build time per venue and language: the image route then serves a file. */
export function generateStaticParams() {
  return themeLocaleParams("sade");
}

export default async function Icon({ params }: { params: Promise<{ mekan: string }> }) {
  const { mekan } = await params;
  return venueIcon("sade", mekan);
}
