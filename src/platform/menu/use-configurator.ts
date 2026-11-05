import { useMemo, useState } from "react";

import {
  choosePrice,
  type ConfigPrice,
  type Configurable,
  evaluate,
  initialSelection,
  type Selection,
  toggle,
} from "./configurator";

/*
 * Kept out of hooks.ts on purpose (D-12): only the product panel uses it, and the panel loads on
 * first use; in hooks.ts the configurator would ride along with the quick menu's first load.
 */

/** REQ-007: the configurator's state for one product; evaluation recomputed on every change. */
export function useConfigurator<P extends ConfigPrice>(item: Configurable<P>) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(item));
  const evaluation = useMemo(() => evaluate(item, selection), [item, selection]);
  return {
    selection,
    evaluation,
    toggleOption: (optionId: string) => {
      setSelection((current) => toggle(item, current, optionId));
    },
    choosePrice: (priceId: string) => {
      setSelection((current) => choosePrice(item, current, priceId));
    },
    reset: () => {
      setSelection(initialSelection(item));
    },
  };
}
