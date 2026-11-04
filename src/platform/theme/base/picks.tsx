"use client";

import { formatMoney } from "../../../lib/format";
import { uiText } from "../../i18n/ui";
import { evaluate } from "../../menu/configurator";
import { usePicks } from "../../menu/hooks";
import { resolvePicks } from "../../menu/picks";
import { itemIndex, t } from "../../menu/view";
import type { PicksProps } from "../contract";
import { T } from "./text";

/**
 * Seçtiklerim slot (REQ-013, BR-SEC-001): the guest's list with quantities and the total, in the
 * browser only. A product taken off the menu stays listed and says so. D-10 adds the large-type
 * "show the waiter" view.
 */
export function BasePicks({ venue }: PicksProps) {
  const ui = uiText(venue.locale);
  const picks = usePicks(venue.slug);
  const items = itemIndex(venue);
  const lines = resolvePicks(picks.picks, items).map(({ pick, item }) => {
    if (!item) return { pick, item, summary: "", lineMinor: 0 };
    const result = evaluate(item, { priceId: pick.priceId ?? "", optionIds: pick.optionIds });
    const summary = [
      result.price.label,
      ...result.chosen.map((option) => t(option.name, venue.locale, venue.defaultLocale).text),
    ]
      .filter(Boolean)
      .join(" · ");
    return { pick, item, summary, lineMinor: result.totalMinor * pick.qty };
  });
  const total = lines.reduce((sum, line) => sum + line.lineMinor, 0);

  if (lines.length === 0) {
    return <p className="py-10 text-center text-muted-foreground">{ui.picks}: 0</p>;
  }
  return (
    <div>
      <h2 className="text-xl font-semibold">{ui.picks}</h2>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {lines.map(({ pick, item, summary, lineMinor }) => (
          <li key={pick.key} className="flex items-center gap-3 py-3">
            <span className="flex min-w-0 flex-1 flex-col">
              {item ? (
                <T text={item.name} page={venue.locale} className="font-medium" />
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              {summary ? <span className="text-sm text-muted-foreground">{summary}</span> : null}
            </span>
            <span className="flex items-center">
              <button
                type="button"
                aria-label="−1"
                onClick={() => {
                  picks.changeQty(pick.key, -1);
                }}
                className="flex size-11 items-center justify-center rounded-full border border-border"
              >
                −
              </button>
              <span className="w-8 text-center tabular-nums">{pick.qty}</span>
              <button
                type="button"
                aria-label="+1"
                onClick={() => {
                  picks.changeQty(pick.key, 1);
                }}
                className="flex size-11 items-center justify-center rounded-full border border-border"
              >
                +
              </button>
            </span>
            <span className="w-20 text-end tabular-nums" dir="ltr">
              {formatMoney(lineMinor, { decimals: "auto" })}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between text-lg font-semibold">
        <span>Σ</span>
        <span className="tabular-nums" dir="ltr">
          {formatMoney(total, { decimals: "auto" })}
        </span>
      </p>
    </div>
  );
}
