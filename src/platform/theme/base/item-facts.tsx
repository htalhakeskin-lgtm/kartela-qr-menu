import { formatNumber } from "../../../lib/format";
import { uiText } from "../../i18n/ui";
import type { ItemFactsProps } from "../contract";
import { T } from "./text";

/**
 * Product information (REQ-005, K-24): allergens in words (never an icon alone), traces, diets,
 * spice, ingredients, energy, portion, origin. A missing field says "ask our staff" instead of
 * staying empty (BR-YSL-005). Energy appears here only, never in the menu rows (K-24).
 */
export function BaseItemFacts({
  item,
  venue,
  allergens = item.allergens,
  diets = item.diets,
}: ItemFactsProps) {
  const ui = uiText(venue.locale);
  const facts: { label: string; value: React.ReactNode }[] = [];
  facts.push({
    label: ui.allergens,
    value:
      allergens.length > 0
        ? allergens.map((allergen) => ui.allergenNames[allergen]).join(", ")
        : "—",
  });
  if (item.mayContain.length > 0) {
    facts.push({
      label: ui.mayContain,
      value: item.mayContain.map((allergen) => ui.allergenNames[allergen]).join(", "),
    });
  }
  if (item.kind !== "tasting") {
    facts.push({
      label: ui.ingredients,
      value: item.ingredients ? <T text={item.ingredients} page={venue.locale} /> : ui.askStaff,
    });
  }
  if (item.kind === "dish" || item.kind === "drink" || item.kind === "set") {
    facts.push({
      label: ui.energy,
      value: item.energyKcal === null ? ui.askStaff : `${formatNumber(item.energyKcal)} kcal`,
    });
  }
  if (item.portionG !== null || item.volumeMl !== null) {
    facts.push({
      label: ui.portion,
      value:
        item.portionG !== null
          ? `${formatNumber(item.portionG)} g`
          : `${formatNumber(item.volumeMl ?? 0)} ml`,
    });
  }
  if (item.spiceLevel > 0) facts.push({ label: ui.spice, value: ui.spiceLevels[item.spiceLevel] });
  if (item.origin)
    facts.push({ label: ui.origin, value: <T text={item.origin} page={venue.locale} /> });

  return (
    <div>
      {diets.length > 0 ? (
        <ul className="mb-4 flex flex-wrap gap-2" aria-label={ui.diets}>
          {diets.map((diet) => (
            <li key={diet} className="rounded-full border border-border px-3 py-1 text-sm">
              {ui.dietNames[diet]}
            </li>
          ))}
        </ul>
      ) : null}
      <dl className="divide-y divide-border border-y border-border">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-4 py-3 text-sm"
          >
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd className="text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
