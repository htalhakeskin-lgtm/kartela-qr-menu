import { defineTheme } from "@/platform/theme/contract";

import meta from "./meta";

/** Sade theme module (ADR-0003). D-09 / D-10 add the base implementation of every slot. */
export default defineTheme({ ...meta, slots: {} });
