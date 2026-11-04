import { themeVenueParams, venueManifest } from "@/platform/routes/venue-files";

// Theme tree file route (ADR-0003): thin binding, logic in src/platform/routes/venue-files.ts.
export function generateStaticParams() {
  return themeVenueParams("rakim");
}

export async function GET(_request: Request, { params }: { params: Promise<{ mekan: string }> }) {
  const { mekan } = await params;
  return venueManifest("rakim", mekan);
}
