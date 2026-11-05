import type { PriceProps } from "@/platform/theme/contract";

/** Price slot: Plex Mono, tabular, the unit label in the text face before it. */
export function RakimPrice({ price }: PriceProps) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-1.5" dir="ltr">
      {price.label ? <span className="text-sm text-muted-foreground">{price.label}</span> : null}
      <span className="font-mono text-base text-foreground tabular-nums">{price.amount}</span>
    </span>
  );
}
