/**
 * Signature motion 3 (plan §11.7, K-28): Hızlı ↔ Keşfet as a cross-document view transition. The
 * top bar keeps its place (view-transition-name in rakim.css); the content slides in from the
 * right on the way to Keşfet and from the left on the way back. `pagereveal` fires before the
 * new page's first paint, so the listener is an inline script in <head>, like the pre-paint
 * script (no dangerouslySetInnerHTML, K-33). Under reduced motion the transition is skipped.
 */
export const pageTransitionSource = [
  'addEventListener("pagereveal",function(e){var t=e.viewTransition;if(!t)return;',
  'if(matchMedia("(prefers-reduced-motion: reduce)").matches){t.skipTransition();return}',
  'try{t.types.add(location.pathname.split("/").filter(Boolean).pop()==="kesfet"?"ileri":"geri")}catch(x){}});',
].join("");

export function PageTransition() {
  return <script>{pageTransitionSource}</script>;
}
