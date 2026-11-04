import type { ItemView } from "./view";
import { type Allergen, ALLERGENS, type Diet, DIETS, type SpiceLevel } from "./vocabulary";

/**
 * Menu filters (REQ-012, D-08): diets the product must have, allergens it must not contain, the
 * highest spice level. Kept in the address bar (?filtre=diyet:vegan;alerjen:gluten.milk;aci:1) so a
 * filtered menu can be shared and survives a reload. Unknown values in the address are ignored.
 */
export type MenuFilters = {
  diets: Diet[];
  excludeAllergens: Allergen[];
  maxSpice: SpiceLevel | null;
};

export const NO_FILTERS: MenuFilters = { diets: [], excludeAllergens: [], maxSpice: null };

export function encodeFilters(filters: MenuFilters): string {
  const parts: string[] = [];
  if (filters.diets.length > 0) parts.push(`diyet:${filters.diets.join(".")}`);
  if (filters.excludeAllergens.length > 0)
    parts.push(`alerjen:${filters.excludeAllergens.join(".")}`);
  if (filters.maxSpice !== null) parts.push(`aci:${String(filters.maxSpice)}`);
  return parts.join(";");
}

export function decodeFilters(param: string | null | undefined): MenuFilters {
  const filters: MenuFilters = { diets: [], excludeAllergens: [], maxSpice: null };
  for (const part of (param ?? "").split(";")) {
    const [key, value = ""] = part.split(":");
    const values = value.split(".").filter(Boolean);
    if (key === "diyet")
      filters.diets = values.filter((v): v is Diet => (DIETS as readonly string[]).includes(v));
    if (key === "alerjen") {
      filters.excludeAllergens = values.filter((v): v is Allergen =>
        (ALLERGENS as readonly string[]).includes(v),
      );
    }
    if (key === "aci" && /^[0-3]$/.test(value)) filters.maxSpice = Number(value) as SpiceLevel;
  }
  return filters;
}

export function activeFilterCount(filters: MenuFilters): number {
  return (
    filters.diets.length + filters.excludeAllergens.length + (filters.maxSpice === null ? 0 : 1)
  );
}

export type FilterMatch = {
  match: boolean;
  /** Excluded allergens the product "may contain" (traces): shown as a warning, not hidden. */
  mayContain: Allergen[];
};

export function matchFilters(
  item: Pick<ItemView, "diets" | "allergens" | "mayContain" | "spiceLevel">,
  filters: MenuFilters,
): FilterMatch {
  const match =
    filters.diets.every((diet) => item.diets.includes(diet)) &&
    !filters.excludeAllergens.some((allergen) => item.allergens.includes(allergen)) &&
    (filters.maxSpice === null || item.spiceLevel <= filters.maxSpice);
  return {
    match,
    mayContain: filters.excludeAllergens.filter((allergen) => item.mayContain.includes(allergen)),
  };
}
