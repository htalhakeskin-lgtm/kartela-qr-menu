"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

/**
 * The phone's "Daha fazla" sheet (13-yonetim-paneli §3, 07-mobil MB-06): the HTML popover API
 * opens and closes it without JavaScript (Esc and an outside tap included); JavaScript only
 * closes it after a client-side navigation, which keeps the layout and the open popover.
 */
export const MORE_SHEET_ID = "panel-daha";

export function MoreSheet({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sheet.current;
    if (element?.matches(":popover-open")) element.hidePopover();
  }, [pathname]);

  return (
    <div
      id={MORE_SHEET_ID}
      ref={sheet}
      popover="auto"
      aria-label="Daha fazla"
      className="inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-2xl border-t border-border bg-surface px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] text-foreground backdrop:bg-black/40 lg:hidden"
    >
      {children}
    </div>
  );
}
