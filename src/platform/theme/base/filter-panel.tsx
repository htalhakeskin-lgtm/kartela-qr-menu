"use client";

import { uiText } from "../../i18n/ui";
import { ALLERGENS, DIETS, SPICE_LEVELS } from "../../menu/vocabulary";
import type { FilterPanelProps } from "../contract";

const chip = (on: boolean) =>
  `flex min-h-11 items-center rounded-full border px-4 text-sm ${
    on ? "border-foreground bg-foreground text-background" : "border-border text-foreground"
  }`;

function toggled<V extends string>(list: readonly V[], value: V): V[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

/** Filter panel slot (REQ-012): diets, allergens to leave out, the highest spice level. */
export function BaseFilterPanel({ filters, onChange, venue }: FilterPanelProps) {
  const ui = uiText(venue.locale);
  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{ui.diets}</legend>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((diet) => (
            <button
              key={diet}
              type="button"
              aria-pressed={filters.diets.includes(diet)}
              onClick={() => {
                onChange({ ...filters, diets: toggled(filters.diets, diet) });
              }}
              className={chip(filters.diets.includes(diet))}
            >
              {ui.dietNames[diet]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{ui.excludeAllergens}</legend>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((allergen) => (
            <button
              key={allergen}
              type="button"
              aria-pressed={filters.excludeAllergens.includes(allergen)}
              onClick={() => {
                onChange({
                  ...filters,
                  excludeAllergens: toggled(filters.excludeAllergens, allergen),
                });
              }}
              className={chip(filters.excludeAllergens.includes(allergen))}
            >
              {ui.allergenNames[allergen]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{ui.maxSpice}</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={filters.maxSpice === null}
            onClick={() => {
              onChange({ ...filters, maxSpice: null });
            }}
            className={chip(filters.maxSpice === null)}
          >
            {ui.anySpice}
          </button>
          {SPICE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={filters.maxSpice === level}
              onClick={() => {
                onChange({ ...filters, maxSpice: level });
              }}
              className={chip(filters.maxSpice === level)}
            >
              {ui.spiceLevels[level]}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
