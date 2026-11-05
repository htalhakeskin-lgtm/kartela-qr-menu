"use client";

import { useEffect, useRef, useState } from "react";

import { formatMoney } from "../../../lib/format";
import { uiText } from "../../i18n/ui";
import { evaluate } from "../../menu/configurator";
import { usePicks } from "../../menu/hooks";
import { resolvePicks, type StoredPick } from "../../menu/picks";
import type { ItemView, VenueView } from "../../menu/view";
import { itemIndex, t } from "../../menu/view";
import { RTL_LOCALES } from "../../tenant/locales";
import type { PicksProps } from "../contract";
import { T } from "./text";

/**
 * Seçtiklerim slot (REQ-013, BR-SEC-001, SCR-004): the guest's list with quantities and the total,
 * kept in the browser only. A product taken off the menu stays listed and says so. "Show the
 * waiter" turns it into a large-type, full-screen list in the venue's own language, so a guest
 * who reads the menu in Arabic can hand the phone to a waiter who reads Turkish.
 */

type Line = {
  pick: StoredPick;
  item: ItemView | null;
  summary: string;
  waiterSummary: string;
  lineMinor: number;
};

function lines(venue: VenueView, picks: readonly StoredPick[]): Line[] {
  const items = itemIndex(venue);
  return resolvePicks(picks, items).map(({ pick, item }) => {
    if (!item) return { pick, item, summary: "", waiterSummary: "", lineMinor: 0 };
    const result = evaluate(item, { priceId: pick.priceId ?? "", optionIds: pick.optionIds });
    const summarize = (locale: VenueView["locale"], label: string | null) =>
      [label, ...result.chosen.map((option) => t(option.name, locale, venue.defaultLocale).text)]
        .filter(Boolean)
        .join(" · ");
    return {
      pick,
      item,
      summary: summarize(venue.locale, result.price.label),
      waiterSummary: summarize(venue.defaultLocale, result.price.defaultLabel),
      lineMinor: result.totalMinor * pick.qty,
    };
  });
}

/** Full-screen list for the waiter; keeps the screen awake where the browser allows it. */
function WaiterView({
  venue,
  rows,
  total,
  onClose,
}: {
  venue: VenueView;
  rows: Line[];
  total: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const ui = uiText(venue.defaultLocale);
  const pageUi = uiText(venue.locale);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    let lock: WakeLockSentinel | undefined;
    // Not every browser has the Wake Lock API (older Safari); without it the screen may dim.
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then(
        (sentinel) => {
          lock = sentinel;
        },
        () => undefined,
      );
    }
    return () => {
      void lock?.release();
      if (dialog?.open) dialog.close();
    };
  }, []);
  return (
    <dialog ref={ref} className="kt-fullscreen" aria-label={ui.waiterTitle} onClose={onClose}>
      <div
        lang={venue.defaultLocale}
        dir={RTL_LOCALES.includes(venue.defaultLocale) ? "rtl" : "ltr"}
        className="flex min-h-full flex-col px-6 py-8"
      >
        <p className="text-sm text-muted-foreground">{venue.name}</p>
        <h2 className="mt-1 text-3xl font-semibold">{ui.waiterTitle}</h2>
        <ul className="mt-6 flex-1 divide-y divide-border border-y border-border">
          {rows
            .filter((row) => row.item)
            .map((row) => (
              <li key={row.pick.key} className="flex gap-4 py-4">
                <span className="text-3xl font-semibold tabular-nums">{row.pick.qty}×</span>
                <span className="flex flex-col">
                  <span className="text-3xl leading-tight font-semibold">
                    {row.item?.defaultName}
                  </span>
                  {row.waiterSummary ? (
                    <span className="mt-1 text-xl">{row.waiterSummary}</span>
                  ) : null}
                </span>
              </li>
            ))}
        </ul>
        <p className="mt-6 flex justify-between text-2xl font-semibold">
          <span>{ui.total}</span>
          <span className="tabular-nums" dir="ltr">
            {formatMoney(total, { decimals: "auto" })}
          </span>
        </p>
        <button
          type="button"
          onClick={onClose}
          lang={venue.locale}
          className="mt-8 min-h-12 rounded-md border border-border text-base"
        >
          {pageUi.backToList}
        </button>
      </div>
    </dialog>
  );
}

export function BasePicks({ venue }: PicksProps) {
  const ui = uiText(venue.locale);
  const picks = usePicks(venue.slug);
  const [waiter, setWaiter] = useState(false);
  const rows = lines(venue, picks.picks);
  const total = rows.reduce((sum, row) => sum + row.lineMinor, 0);

  if (rows.length === 0) {
    return (
      <div className="py-8">
        <h2 className="text-xl font-semibold">{ui.picks}</h2>
        <p className="mt-3 text-muted-foreground">{ui.emptyPicks}</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-xl font-semibold">{ui.picks}</h2>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {rows.map(({ pick, item, summary, lineMinor }) => (
          <li key={pick.key} className="flex items-center gap-3 py-3">
            <span className="flex min-w-0 flex-1 flex-col">
              {item ? (
                <T text={item.name} page={venue.locale} className="font-medium" />
              ) : (
                <span className="text-muted-foreground">{ui.unavailable}</span>
              )}
              {summary ? <span className="text-sm text-muted-foreground">{summary}</span> : null}
            </span>
            <span className="flex items-center">
              <button
                type="button"
                aria-label={`${item?.name.text ?? ""} −1`}
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
                aria-label={`${item?.name.text ?? ""} +1`}
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
        <span>{ui.total}</span>
        <span className="tabular-nums" dir="ltr">
          {formatMoney(total, { decimals: "auto" })}
        </span>
      </p>
      <button
        type="button"
        onClick={() => {
          setWaiter(true);
        }}
        className="mt-6 min-h-12 w-full rounded-md bg-primary text-base font-semibold text-primary-foreground"
      >
        {ui.showWaiter}
      </button>
      {waiter ? (
        <WaiterView
          venue={venue}
          rows={rows}
          total={total}
          onClose={() => {
            setWaiter(false);
          }}
        />
      ) : null}
    </div>
  );
}
