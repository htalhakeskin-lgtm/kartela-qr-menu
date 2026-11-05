"use client";

import Image from "next/image";
import { type ComponentType, type ReactNode, useState } from "react";

import { formatMoney } from "../../../lib/format";
import { uiText } from "../../i18n/ui";
import { usePicks } from "../../menu/hooks";
import { useConfigurator } from "../../menu/use-configurator";
import { itemIndex, type Text } from "../../menu/view";
import type {
  ImageFallbackProps,
  ItemSheetProps,
  OptionPickerProps,
  PriceProps,
} from "../contract";
import { AvailabilityNote, BaseImageFallback } from "./item-card";
import { BaseItemFacts } from "./item-facts";
import { BaseOptionPicker } from "./option-picker";
import { BasePrice } from "./price";
import { Sheet } from "./sheet";
import { T } from "./text";

/**
 * Item sheet slot (SCR-003): photo (16:10) or the typographic data card → name, description →
 * prices or the configurator → availability → product information → contents / courses →
 * "goes well with" → a sticky "Add to my picks · total" button.
 *
 * The layout takes its parts, so a theme redesigns the panel by swapping them (Rakım's recipe
 * card, D-16) instead of copying it: the configurator, the price, the data card, the total, and
 * an optional view-transition name for the photo (signature motion 2).
 */
export type ItemSheetParts = {
  OptionPicker: ComponentType<OptionPickerProps>;
  Price: ComponentType<PriceProps>;
  ImageFallback: ComponentType<ImageFallbackProps>;
  /** The total on the add button; plain text by default. */
  total?: (minor: number) => ReactNode;
  /** view-transition-name of the photo, matched by the row's thumbnail (K-28). */
  imageTransitionName?: string;
};

const baseParts: ItemSheetParts = {
  OptionPicker: BaseOptionPicker,
  Price: BasePrice,
  ImageFallback: BaseImageFallback,
};

export function BaseItemSheet(props: ItemSheetProps) {
  return <ItemSheetLayout {...props} parts={baseParts} />;
}

export function ItemSheetLayout({
  item,
  venue,
  status,
  onClose,
  onOpenItem,
  parts,
}: ItemSheetProps & { parts: ItemSheetParts }) {
  const { OptionPicker, Price, ImageFallback } = parts;
  const ui = uiText(venue.locale);
  const configurator = useConfigurator(item);
  const picks = usePicks(venue.slug);
  const [added, setAdded] = useState(false);
  const others = itemIndex(venue);
  const configurable = item.optionGroups.length > 0 || item.prices.length > 1;
  const canAdd = !status?.soldOut && configurator.evaluation.complete;
  const related = (ids: string[], title: string) => {
    const list = ids.flatMap((id) => {
      const other = others.get(id);
      return other ? [other] : [];
    });
    if (list.length === 0) return null;
    return (
      <section className="mt-8">
        <h3 className="mb-2 text-sm font-semibold">{title}</h3>
        <ul className="divide-y divide-border border-y border-border">
          {list.map((other) => (
            <li key={other.id}>
              <button
                type="button"
                onClick={() => {
                  onOpenItem(other.id);
                }}
                className="flex min-h-11 w-full items-baseline justify-between gap-4 py-3 text-start"
              >
                <T text={other.name} page={venue.locale} />
                {other.defaultPrice ? <Price price={other.defaultPrice} /> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <Sheet
      label={item.name.text}
      closeLabel={ui.close}
      onClose={onClose}
      footer={
        <button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            picks.add({
              itemId: item.id,
              priceId: configurator.selection.priceId,
              optionIds: configurator.evaluation.chosen.map((option) => option.id),
            });
            setAdded(true);
          }}
          className="flex min-h-12 w-full items-center justify-between rounded-md bg-primary px-4 text-base font-semibold text-primary-foreground disabled:opacity-50"
        >
          <span>{added ? ui.added : status?.soldOut ? ui.soldOut : ui.addToPicks}</span>
          <span className="tabular-nums" dir="ltr">
            {parts.total
              ? parts.total(configurator.evaluation.totalMinor)
              : formatMoney(configurator.evaluation.totalMinor, { decimals: "auto" })}
          </span>
        </button>
      }
    >
      <div className="-mx-4 aspect-[16/10] overflow-hidden">
        {item.image ? (
          <Image
            src={item.image.src}
            alt={item.image.alt.text}
            width={item.image.width}
            height={item.image.height}
            sizes="(min-width: 640px) 640px, 100vw"
            className="size-full object-cover"
            style={{
              objectPosition: `${String(item.image.focalX)}% ${String(item.image.focalY)}%`,
              viewTransitionName: parts.imageTransitionName,
            }}
          />
        ) : (
          <ImageFallback item={item} venue={venue} />
        )}
      </div>

      <h2 className="mt-5 text-2xl leading-tight font-semibold">
        <T text={item.name} page={venue.locale} />
      </h2>
      {item.description ? (
        <p className="mt-2 leading-relaxed text-muted-foreground">
          <T text={item.description} page={venue.locale} />
        </p>
      ) : null}
      <div className="mt-2">
        <AvailabilityNote status={status} venue={venue} />
      </div>

      <div className="mt-6">
        {configurable ? (
          <OptionPicker item={item} venue={venue} configurator={configurator} />
        ) : item.defaultPrice ? (
          <p className="text-lg">
            <Price price={item.defaultPrice} />
          </p>
        ) : null}
      </div>

      {item.components.length > 0
        ? related(
            item.components.map((c) => c.itemId),
            ui.contains,
          )
        : null}
      {item.courses.length > 0 ? (
        <section className="mt-8">
          <h3 className="mb-2 text-sm font-semibold">{ui.courses}</h3>
          <ol className="divide-y divide-border border-y border-border">
            {item.courses.map((course) => (
              <li key={course.no} className="flex gap-4 py-3">
                <span className="font-mono text-sm text-muted-foreground">
                  {String(course.no).padStart(2, "0")}
                </span>
                <span className="flex flex-col">
                  <T text={course.title} page={venue.locale} className="font-medium" />
                  {course.itemId ? (
                    <CourseItemName item={others.get(course.itemId)} page={venue.locale} />
                  ) : null}
                  {course.description ? (
                    <T
                      text={course.description}
                      page={venue.locale}
                      className="text-sm text-muted-foreground"
                    />
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-8">
        <BaseItemFacts
          item={item}
          venue={venue}
          allergens={configurator.evaluation.allergens}
          diets={configurator.evaluation.diets}
        />
      </section>

      {related(
        item.pairings.map((p) => p.itemId),
        ui.goesWith,
      )}
    </Sheet>
  );
}

function CourseItemName({ item, page }: { item: { name: Text } | undefined; page: string }) {
  return item ? <T text={item.name} page={page} className="text-sm text-muted-foreground" /> : null;
}
