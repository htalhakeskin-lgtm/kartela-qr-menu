import { baseSlots } from "@/platform/theme/base/slots";
import { defineTheme } from "@/platform/theme/contract";

import meta from "./meta";

/** Sade theme module (ADR-0003): the base implementation of every slot, as it is. */
export default defineTheme({ ...meta, slots: baseSlots });
