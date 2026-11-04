import { defineTheme } from "@/platform/theme/contract";

import meta from "./meta";

/** Rakım theme module (ADR-0003). Slots arrive with D-15 / D-16; until then Sade's base applies. */
export default defineTheme({ ...meta, slots: {} });
