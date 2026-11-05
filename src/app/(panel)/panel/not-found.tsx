import Link from "next/link";

import { buttonClass } from "@/components/panel/ui";

/**
 * Panel 404: a page that does not exist and a venue the user may not open look the same
 * (BR-KRC-003), so the text names neither.
 */
export default function PanelNotFound() {
  return (
    <main id="icerik" className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-4">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Bu sayfaya ulaşılamıyor</h1>
      <p className="mt-2 text-muted-foreground">
        Sayfa yok ya da bu mekânın paneline erişiminiz bulunmuyor.
      </p>
      <Link href="/panel" className={buttonClass("primary", "mt-6 self-start")}>
        Mekânlarıma dön
      </Link>
    </main>
  );
}
