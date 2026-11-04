import type { Metadata } from "next";

import { LegalPage } from "@/components/platform/legal-page";
import { pageMetadata } from "@/lib/seo";
import { readLegalDocument } from "@/server/content/legal";

export const metadata: Metadata = pageMetadata({
  title: "KVKK aydınlatma metni",
  description:
    "Kartela'nın kişisel verileri hangi amaçla işlediği, mekân ziyaretçisinden neden veri alınmadığı ve haklarınız.",
  path: "/kvkk",
});

export default async function Page() {
  return <LegalPage document={await readLegalDocument("kvkk")} />;
}
