"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Mobile menu that works before hydration and without JavaScript (07-mobil §4, MB-06):
 * the HTML popover API opens and closes it natively (Esc and outside tap included).
 * JavaScript only adds one thing: closing the menu after a client-side navigation, because the
 * layout (and the open popover) survives it. Show this below `lg`; desktop gets an inline list.
 *
 * Optional, in globals.css: `body:has(#ana-menu:popover-open) { overflow: hidden; }`
 */

export type NavItem = { href: Route; label: string };

const MENU_ID = "ana-menu";

export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const menu = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = menu.current;
    if (element?.matches(":popover-open")) element.hidePopover();
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        popoverTarget={MENU_ID}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-3 font-medium"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
        Menü
      </button>
      <nav
        id={MENU_ID}
        ref={menu}
        popover="auto"
        aria-label="Ana menü"
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-background p-4 text-foreground backdrop:bg-black/40"
      >
        <div className="flex justify-end">
          <button
            type="button"
            popoverTarget={MENU_ID}
            popoverTargetAction="hide"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 font-medium"
          >
            Kapat
          </button>
        </div>
        <ul className="mt-4 flex flex-col">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className="block min-h-11 py-3 text-lg"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
