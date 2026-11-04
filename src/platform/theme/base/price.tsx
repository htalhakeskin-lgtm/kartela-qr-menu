import type { PriceProps } from "../contract";

/** Price slot: the text is written by the core (unit, Turkish money format); the slot lays it out. */
export function BasePrice({ price }: PriceProps) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-1.5 tabular-nums" dir="ltr">
      {price.label ? <span className="text-sm text-muted-foreground">{price.label}</span> : null}
      <span className="font-medium text-foreground">{price.amount}</span>
    </span>
  );
}
