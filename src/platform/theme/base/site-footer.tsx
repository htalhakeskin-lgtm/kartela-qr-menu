import { SiteCredit } from "../../../components/layout/site-credit";
import { uiText } from "../../i18n/ui";
import type { VenueView } from "../../menu/view";
import { ColourChoice } from "./colour-choice";

/**
 * The venue site's footer (quick menu and Keşfet): the colour choice, the demo note in a demo
 * venue (plan K-06, only here, never inside the menu) and the maker's credit as the last row.
 */
export function SiteFooter({ venue }: { venue: VenueView }) {
  const ui = uiText(venue.locale);
  return (
    <footer className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
      <ColourChoice locale={venue.locale} />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        {venue.mode === "demo" ? <p>{ui.demoNote}</p> : <span />}
        <SiteCredit className="shrink-0 text-xs text-muted-foreground" />
      </div>
    </footer>
  );
}
