import { defineTheme } from "@/platform/theme/contract";

import meta from "./meta";
import { rakimSlots } from "./slots";

/** Rakım theme module (ADR-0003): its slots over the base (D-15; D-16 / D-17 add the signatures). */
export default defineTheme({ ...meta, slots: rakimSlots });
