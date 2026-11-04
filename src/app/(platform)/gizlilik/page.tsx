import type { Metadata } from "next";

import { LegalPage } from "@/components/platform/legal-page";
import { pageMetadata } from "@/lib/seo";
import { readLegalDocument } from "@/server/content/legal";

export const metadata: Metadata = pageMetadata({
  title: "Gizlilik politikası",
  description:
    "Kartela'da hangi bilgilerin tutulduğu ve nasıl korunduğu: menü ziyaretçisinden kişisel veri alınmaz.",
  path: "/gizlilik",
});

export default async function Page() {
  return <LegalPage document={await readLegalDocument("gizlilik")} />;
}
