import { toSearchKey } from "../../lib/text";
import type { ItemView } from "./view";

/**
 * Instant menu search (REQ-012, D-08): Turkish-aware ("ışık" finds "IŞIK", "corba" finds "Çorba"),
 * every word must match somewhere in the name, description or ingredients. Below the minimum
 * length (P-07) there is no search yet: null, not an empty result.
 */
export function searchItems<T extends Pick<ItemView, "searchKey">>(
  items: readonly T[],
  query: string,
  minChars: number,
): T[] | null {
  const key = toSearchKey(query);
  if (key.length < minChars) return null;
  const words = key.split(" ");
  return items.filter((item) => words.every((word) => item.searchKey.includes(word)));
}
