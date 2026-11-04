import type { Metadata } from "next";

import { LegalPage } from "@/components/platform/legal-page";
import { pageMetadata } from "@/lib/seo";
import { readLegalDocument } from "@/server/content/legal";

export const metadata: Metadata = pageMetadata({
  title: "Çerez politikası",
  description:
    "Kartela ve mekân sitelerinde kullanılan çerezler: analitik ya da reklam çerezi yok, istatistikler çerezsiz.",
  path: "/cerez-politikasi",
});

export default async function Page() {
  return <LegalPage document={await readLegalDocument("cerez")} />;
}
