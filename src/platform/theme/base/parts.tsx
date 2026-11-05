"use client";

import { uiText } from "../../i18n/ui";
import type {
  EmptyStateProps,
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

/** Legal note slot (BR-YSL-001, BR-YSL-002): in every language, at the end of every menu page. */
export function BaseLegalNote({ venue }: LegalNoteProps) {
  const ui = uiText(venue.locale);
  return (
    <section
      aria-label={ui.legalNotes}
      id="yasal"
      className="mt-16 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground"
    >
      <p>
        {ui.vatIncluded} {ui.noServiceCharge} {ui.printedList}
      </p>
      <p className="mt-3">
        {venue.info?.allergenStatement ? (
          <T text={venue.info.allergenStatement} page={venue.locale} />
        ) : (
          ui.allergenStatement
        )}
      </p>
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
