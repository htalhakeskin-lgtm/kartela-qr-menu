import { DISPLAY_TIME_ZONE } from "@/lib/format";

/**
 * Pre-paint script (ADR-0005, D-08): before the first paint it writes the venue's time of day and
 * the guest's colour choice onto <html>, so a theme's evening set or a dark choice never flashes
 * in after the light one. Inline and tiny; the static CSP allows inline scripts (K-33).
 *
 * - data-gun-dilimi: sabah 05:00–11:59 · ogle 12:00–18:59 · aksam 19:00–22:59 · gece 23:00–04:59
 *   in the venue's time zone (not the phone's)
 * - data-renk: "acik" | "koyu" when the guest chose one (localStorage kartela:renk); absent = system
 *
 * Rendered as the text of a <script> element: React writes it as is (escaping "</script"), so no
 * dangerouslySetInnerHTML is needed (KURALLAR D).
 */
export const COLOUR_STORAGE_KEY = "kartela:renk";

export function prePaintSource(timeZone: string = DISPLAY_TIME_ZONE): string {
  return [
    "(function(){try{",
    "var d=document.documentElement;",
    `var h=Number(new Intl.DateTimeFormat("en-GB",{hour:"numeric",hourCycle:"h23",timeZone:${JSON.stringify(timeZone)}}).format(new Date()));`,
    'd.setAttribute("data-gun-dilimi",h>=5&&h<12?"sabah":h>=12&&h<19?"ogle":h>=19&&h<23?"aksam":"gece");',
    `var c=localStorage.getItem(${JSON.stringify(COLOUR_STORAGE_KEY)});`,
    'if(c==="acik"||c==="koyu")d.setAttribute("data-renk",c);',
    "}catch(e){}})();",
  ].join("");
}

export function PrePaint({ timeZone }: { timeZone?: string }) {
  return <script>{prePaintSource(timeZone)}</script>;
}
