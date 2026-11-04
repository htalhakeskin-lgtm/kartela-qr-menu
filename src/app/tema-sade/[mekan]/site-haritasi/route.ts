import { themeVenueParams, venueSitemap } from "@/platform/routes/venue-files";

// Theme tree file route (ADR-0003): thin binding, logic in src/platform/routes/venue-files.ts.
export function generateStaticParams() {
  return themeVenueParams("sade");
}

export async function GET(_request: Request, { params }: { params: Promise<{ mekan: string }> }) {
  const { mekan } = await params;
  return venueSitemap("sade", mekan);
}
