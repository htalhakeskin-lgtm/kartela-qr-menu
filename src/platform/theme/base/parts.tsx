"use client";

import { uiText } from "../../i18n/ui";
import { ALLERGENS, DIETS, SPICE_LEVELS } from "../../menu/vocabulary";
import type {
  EmptyStateProps,
  FilterPanelProps,
  LegalNoteProps,
  MenuNoticeProps,
  SearchFieldProps,
  SectionHeaderProps,
} from "../contract";
import { T } from "./text";

/** Section header slot: anchor target of the category bar; h2 / h3 by the page outline. */
export function BaseSectionHeader({ section, venue, level }: SectionHeaderProps) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="pt-10 md:pt-16">
      <Heading
        id={`bolum-${section.id}`}
        className={`scroll-mt-32 font-semibold tracking-tight ${level === 2 ? "text-2xl" : "text-lg"}`}
      >
        <T text={section.name} page={venue.locale} />
      </Heading>
      {section.description ? (
        <p className="mt-1 text-sm text-muted-foreground">
          <T text={section.description} page={venue.locale} />
        </p>
      ) : null}
    </div>
  );
}

/** Menu notice slot (BR-MNU-002): a menu outside its window says when it starts. */
export function BaseMenuNotice({ status, venue }: MenuNoticeProps) {
  const ui = uiText(venue.locale);
  if (status.state === "open") return null;
  const text =
    status.state === "later" && status.inDays === 0 ? ui.startsAt(status.startsAt) : ui.closedNow;
  return <p className="mt-1 text-sm text-muted-foreground">{text}</p>;
}

/** Search field slot: 16 px text (no zoom on iOS), search keyboard, labelled. */
export function BaseSearchField({ value, onChange, venue }: SearchFieldProps) {
  const ui = uiText(venue.locale);
  return (
    <label className="block">
      <span className="sr-only">{ui.searchPlaceholder}</span>
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        // eslint-disable-next-line jsx-a11y/no-autofocus -- the search sheet exists to type; focusing its field is the point
        autoFocus
        value={value}
        placeholder={ui.searchPlaceholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="min-h-12 w-full rounded-md border border-border bg-surface px-4 text-base outline-none focus-visible:border-foreground"
      />
    </label>
  );
}

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

/** Legal note slot (BR-YSL-001, BR-YSL-002): in every language, at the end of every menu page. */
export function BaseLegalNote({ venue }: LegalNoteProps) {
  const ui = uiText(venue.locale);
  return (
    <section
      aria-label={ui.info}
      id="bilgi"
      className="mt-16 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground"
    >
      <p>
        {ui.vatIncluded} {ui.noServiceCharge} {ui.printedList}
      </p>
      <p className="mt-3">{ui.allergenStatement}</p>
    </section>
  );
}

/** Empty state slot: nothing found, nothing matches, no menu of the day. */
export function BaseEmptyState({ reason, venue }: EmptyStateProps) {
  const ui = uiText(venue.locale);
  const text =
    reason === "search"
      ? ui.noResults
      : reason === "filter"
        ? ui.noFilterResults
        : reason === "explore"
          ? ui.stories
          : ui.closedNow;
  return <p className="py-10 text-center text-muted-foreground">{text}</p>;
}
