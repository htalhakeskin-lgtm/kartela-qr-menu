"use client";

import { formatMoney } from "@/lib/format";
import { uiText } from "@/platform/i18n/ui";
import { t } from "@/platform/menu/view";
import type { OptionPickerProps } from "@/platform/theme/contract";

/**
 * Rakım's signature (plan §11.1, REQ-019, D-16): the coffee configurator as a recipe card. Each
 * choice is a ledger line — the group on the left, what is chosen and what it adds on the right
 * in Plex Mono ("Shot · çift · +35 ₺") — with its options as chips under it; the summary line
 * ("12 oz · yulaf · çift shot") closes the card and goes to Seçtiklerim as it is. Native radio
 * buttons and checkboxes inside the chips: keyboard and screen readers work unchanged. A
 * selected chip is an accent field with paper text (plan §11.2: the accent never sits as text on
 * the muted surface); a blocked one says why.
 */

const delta = (minor: number) =>
  minor === 0
    ? null
    : `${minor > 0 ? "+" : "−"}${formatMoney(Math.abs(minor), { decimals: "auto" })}`;

const chip =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]";

export function RakimOptionPicker({ item, venue, configurator }: OptionPickerProps) {
  const ui = uiText(venue.locale);
  const { evaluation, toggleOption, choosePrice, selection } = configurator;
  const label = (field: Parameters<typeof t>[0]) =>
    t(field, venue.locale, venue.defaultLocale).text;
  const chosenPrice = item.prices.find((price) => price.id === selection.priceId);

  // The summary line: the size when there is a choice, then every chosen option.
  const summary = [
    ...(item.prices.length > 1 && chosenPrice?.label ? [chosenPrice.label] : []),
    ...evaluation.chosen.map((option) => label(option.name)),
  ];

  return (
    <div className="rounded-[6px] border border-border bg-surface">
      <p className="border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground">
        {venue.locale === "tr" ? "Tarif" : "Recipe"}
      </p>
      <div className="flex flex-col divide-y divide-border">
        {item.prices.length > 1 ? (
          <fieldset className="px-4 py-3">
            <legend className="sr-only">{ui.portion}</legend>
            <div className="flex items-baseline justify-between gap-4" aria-hidden="true">
              <span className="text-sm font-semibold">{ui.portion}</span>
              <span className="font-mono text-sm tabular-nums">
                {chosenPrice ? `${chosenPrice.label ?? ""} · ${chosenPrice.amount}` : null}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.prices.map((price) => (
                <label key={price.id} className={`${chip} border-border`}>
                  <input
                    type="radio"
                    name={`fiyat-${item.id}`}
                    checked={selection.priceId === price.id}
                    onChange={() => {
                      choosePrice(price.id);
                    }}
                    className="sr-only"
                  />
                  <span>{price.label ?? ui.portion}</span>
                  <span className="font-mono tabular-nums" dir="ltr">
                    {price.amount}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {evaluation.groups.map(({ group, options }) => {
          const single = group.max === 1;
          const chosen = options.filter((entry) => entry.selected);
          const chosenText = chosen.map((entry) => label(entry.option.name)).join(", ");
          const chosenDelta = delta(
            chosen.reduce((sum, entry) => sum + entry.option.priceDeltaMinor, 0),
          );
          const rule =
            group.min >= 1
              ? single
                ? ui.required
                : ui.chooseExactly(group.min)
              : single
                ? ui.optional
                : ui.chooseUpTo(group.max);
          return (
            <fieldset key={group.id} className="px-4 py-3">
              <legend className="sr-only">
                {label(group.name)} · {rule}
              </legend>
              <div className="flex items-baseline justify-between gap-4" aria-hidden="true">
                <span className="text-sm font-semibold">{label(group.name)}</span>
                <span className="truncate font-mono text-sm text-muted-foreground tabular-nums">
                  {chosenText ? [chosenText, chosenDelta].filter(Boolean).join(" · ") : rule}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {options.map(({ option, selected, blocked }) => {
                  const reason =
                    blocked?.reason === "unavailable"
                      ? ui.unavailable
                      : blocked?.reason === "excluded"
                        ? blocked.message
                          ? label(blocked.message)
                          : null
                        : null;
                  const disabled = blocked !== null && !(single && blocked.reason === "group_full");
                  const plus = delta(option.priceDeltaMinor);
                  return (
                    <label
                      key={option.id}
                      title={reason ?? undefined}
                      className={`${chip} ${disabled ? "cursor-not-allowed border-dashed border-border text-muted-foreground" : "border-border"}`}
                    >
                      <input
                        type={single ? "radio" : "checkbox"}
                        name={`grup-${group.id}`}
                        checked={selected}
                        disabled={disabled}
                        onChange={() => {
                          toggleOption(option.id);
                        }}
                        className="sr-only"
                      />
                      <span>{label(option.name)}</span>
                      {plus ? (
                        <span className="font-mono text-xs tabular-nums" dir="ltr">
                          {plus}
                        </span>
                      ) : null}
                      {reason ? <span className="sr-only">{reason}</span> : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
      {summary.length > 0 ? (
        <p className="border-t border-border px-4 py-3 font-mono text-sm text-foreground">
          {summary.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
