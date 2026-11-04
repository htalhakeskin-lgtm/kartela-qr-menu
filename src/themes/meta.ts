import type { ThemeId } from "@/platform/tenant/registry-schema";
import type { ThemeMeta } from "@/platform/theme/contract";

import rakim from "./rakim/meta";
import sade from "./sade/meta";

/**
 * Component-free theme metadata by id, for platform code that serves every theme (venue files,
 * manifest colours, tests). `pnpm tema:yeni` adds a line (D-21).
 */
export const themeMeta: Record<ThemeId, ThemeMeta> = { rakim, sade };
