import type { Text } from "../../menu/view";

/**
 * "Dimmed" (sold out, out of season, a menu outside its window) without lowering text contrast:
 * every text takes the muted colour (≥ 4.5:1, WCAG AA), only photos fade. Opacity on text would
 * fail the contrast check (found by axe in D-09).
 */
export const DIMMED = "[&_*]:text-muted-foreground! [&_img]:opacity-60";

/**
 * A localized text with its language marked where it fell back (BR-MNU-003): the Turkish
 * description on the Arabic page is read by a screen reader in Turkish and laid out left to right.
 */
export function T({ text, page, className }: { text: Text; page: string; className?: string }) {
  if (text.lang === page) return <span className={className}>{text.text}</span>;
  return (
    <span lang={text.lang} dir="auto" className={className}>
      {text.text}
    </span>
  );
}
