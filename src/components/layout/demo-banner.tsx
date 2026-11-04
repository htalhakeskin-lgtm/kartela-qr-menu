import { env } from "@/lib/env";

/**
 * Platform pages: shown while PLATFORM_DEMO=true (02-mimari §5, Z-06). Server component: the flag
 * never reaches the browser bundle. Venue sites have their own note driven by `venues.mode`
 * (D-11, plan K-06). Kept visible in portfolio screenshots (19-portfolyo §3).
 */
export function DemoBanner() {
  if (!env.PLATFORM_DEMO) return null;
  return (
    <div role="note" className="bg-foreground px-4 py-2 text-center text-sm text-background">
      <span className="sm:hidden">Gösterim amaçlı demo</span>
      <span className="hidden sm:inline">
        Gösterim amaçlı demo — platform, mekânlar, kişiler ve fiyatlar kurgusaldır.
      </span>
    </div>
  );
}
