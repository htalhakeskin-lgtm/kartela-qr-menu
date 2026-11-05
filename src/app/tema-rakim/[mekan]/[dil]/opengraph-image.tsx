import { SHARE_IMAGE_SIZE, venueShareImage } from "@/platform/routes/venue-images";
import { themeLocaleParams } from "@/platform/tenant/registry";

// Theme tree metadata image (ADR-0003): thin binding, drawing in src/platform/routes/venue-images.tsx.
export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";

/** Drawn at build time per venue and language: the image route then serves a file. */
export function generateStaticParams() {
  return themeLocaleParams("rakim");
}

export default async function Image({ params }: { params: Promise<{ mekan: string }> }) {
  const { mekan } = await params;
  return venueShareImage("rakim", mekan);
}
