import { uiText } from "../../i18n/ui";
import type { Locale } from "../../tenant/registry-schema";

/**
 * The venue's offline page (SCR-009, D-13): the service worker stores it at install and shows it
 * for a page never opened while the device is offline. No database read (it must render from the
 * build alone) and no shell; the link leads back to the menu, which works offline once opened.
 */
export function OfflinePage({
  locale,
  venueName,
  homePath,
}: {
  locale: Locale;
  venueName: string;
  homePath: string;
}) {
  const ui = uiText(locale);
  return (
    <main className="mx-auto flex min-h-dvh max-w-[40rem] flex-col justify-center px-4 py-16">
      <p className="text-sm font-semibold text-muted-foreground">{venueName}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{ui.offlineTitle}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{ui.offlineBody}</p>
      <a
        href={homePath}
        className="mt-8 inline-flex min-h-12 items-center justify-center self-start rounded-md bg-primary px-6 font-semibold text-primary-foreground"
      >
        {ui.backToMenu}
      </a>
    </main>
  );
}
