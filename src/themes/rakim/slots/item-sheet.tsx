"use client";

import { formatMoney } from "@/lib/format";
import { ItemSheetLayout, type ItemSheetParts } from "@/platform/theme/base/item-sheet";
import type { ItemSheetProps } from "@/platform/theme/contract";

import { RakimImageFallback } from "./item-card";
import { RAKIM_ITEM_PHOTO } from "./names";
import { RakimPrice } from "./price";
import { RakimOptionPicker } from "./recipe-card";
import { RollingNumber } from "./rolling-number";

const parts: ItemSheetParts = {
  OptionPicker: RakimOptionPicker,
  Price: RakimPrice,
  ImageFallback: RakimImageFallback,
  total: (minor) => <RollingNumber text={formatMoney(minor, { decimals: "auto" })} />,
  imageTransitionName: RAKIM_ITEM_PHOTO,
};

/**
 * Rakım's product panel (SCR-003, D-16): the base panel's layout with the recipe card, the mono
 * price and data card, the rolling total (signature motion 1) and the photo that the row's
 * thumbnail grows into (signature motion 2).
 */
export function RakimItemSheet(props: ItemSheetProps) {
  return <ItemSheetLayout {...props} parts={parts} />;
}
