import { env } from "@/lib/env";

/**
 * The panel's demo note (13-yonetim-paneli §3): every venue, person and price in the demo panel
 * is fictional, and the demo accounts are shared. Server component; the flag never reaches the
 * browser.
 */
export function PanelDemoStrip() {
  if (!env.PLATFORM_DEMO) return null;
  return (
    <div role="note" className="bg-foreground px-4 py-2 text-center text-sm text-background">
      Demo panel: mekânlar, kişiler ve fiyatlar kurgusaldır; demo hesapları ortak kullanılır.
    </div>
  );
}
