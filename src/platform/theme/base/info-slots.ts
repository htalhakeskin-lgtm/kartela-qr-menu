import type { InfoSlots } from "./info";
import { BaseLegalNote } from "./parts";
import { BaseShell } from "./shell";

/** The information page's slots, named one by one so the quick menu's code stays off the page. */
export const baseInfoSlots: InfoSlots = { Shell: BaseShell, LegalNote: BaseLegalNote };
