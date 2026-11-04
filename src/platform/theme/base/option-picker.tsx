"use client";

import { formatMoney } from "../../../lib/format";
import { uiText } from "../../i18n/ui";
import { t } from "../../menu/view";
import type { OptionPickerProps } from "../contract";

/**
 * Configurator slot (REQ-007): native radio buttons for single-choice groups and checkboxes for
 * the others, so keyboard and screen readers work without extra code. A blocked option is
 * disabled and says why (sold out, the group is full, incompatible with another choice).
 */
export function BaseOptionPicker({ item, venue, configurator }: OptionPickerProps) {
  const ui = uiText(venue.locale);
  const { evaluation, toggleOption, choosePrice, selection } = configurator;
  const label = (field: Parameters<typeof t>[0]) =>
    t(field, venue.locale, venue.defaultLocale).text;

  return (
    <div className="flex flex-col gap-6">
      {item.prices.length > 1 ? (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{ui.portion}</legend>
          <div className="flex flex-col">
            {item.prices.map((price) => (
              <label
                key={price.id}
                className="flex min-h-11 items-center gap-3 border-b border-border py-2"
              >
                <input
                  type="radio"
                  name={`fiyat-${item.id}`}
                  checked={selection.priceId === price.id}
                  onChange={() => {
                    choosePrice(price.id);
                  }}
                  className="size-5 accent-[var(--primary)]"
                />
                <span className="flex-1">{price.label ?? ui.portion}</span>
                <span className="tabular-nums" dir="ltr">
                  {price.amount}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {evaluation.groups.map(({ group, options }) => {
        const single = group.max === 1;
        const rule =
          group.min >= 1
            ? single
              ? ui.required
              : ui.chooseExactly(group.min)
            : single
              ? ui.optional
              : ui.chooseUpTo(group.max);
        return (
          <fieldset key={group.id}>
            <legend className="mb-2 flex w-full items-baseline justify-between gap-4">
              <span className="text-sm font-semibold">{label(group.name)}</span>
              <span className="text-xs text-muted-foreground">{rule}</span>
            </legend>
            <div className="flex flex-col">
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
                return (
                  <label
                    key={option.id}
                    className={`flex min-h-11 items-center gap-3 border-b border-border py-2 ${disabled ? "opacity-50" : ""}`}
                  >
                    <input
                      type={single ? "radio" : "checkbox"}
                      name={`grup-${group.id}`}
                      checked={selected}
                      disabled={disabled}
                      onChange={() => {
                        toggleOption(option.id);
                      }}
                      className="size-5 accent-[var(--primary)]"
                    />
                    <span className="flex flex-1 flex-col">
                      <span>{label(option.name)}</span>
                      {reason ? (
                        <span className="text-xs text-muted-foreground">{reason}</span>
                      ) : null}
                    </span>
                    {option.priceDeltaMinor !== 0 ? (
                      <span className="text-sm text-muted-foreground tabular-nums" dir="ltr">
                        {option.priceDeltaMinor > 0 ? "+" : "−"}
                        {formatMoney(Math.abs(option.priceDeltaMinor), { decimals: "auto" })}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
