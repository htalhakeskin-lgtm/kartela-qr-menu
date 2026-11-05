import { type ComponentType, lazy } from "react";

/**
 * A slot whose code loads on first use (D-12). The quick menu's sheets — product panel and its
 * configurator, Seçtiklerim, the filter panel — open on a tap; leaving them out of the first load
 * keeps the menu page's JavaScript small, and on mobile Lighthouse counts every script requested
 * before the largest paint against it. `preload()` fetches the code ahead of the tap.
 */
export type LazySlot<P> = ComponentType<P> & { preload: () => Promise<ComponentType<P>> };

export function lazySlot<P extends object>(load: () => Promise<ComponentType<P>>): LazySlot<P> {
  let pending: Promise<ComponentType<P>> | null = null;
  const preload = () => (pending ??= load());
  const component = lazy(() => preload().then((resolved) => ({ default: resolved })));
  return Object.assign(component, { preload });
}

/** Starts loading every lazy slot among the given ones; eager slots are skipped. */
export function preloadSlots(slots: Iterable<unknown>): void {
  for (const slot of slots) {
    if (
      slot &&
      typeof slot === "object" &&
      "preload" in slot &&
      typeof slot.preload === "function"
    ) {
      void (slot.preload as () => Promise<unknown>)();
    }
  }
}

/** The loaded component behind a slot (tests, server renders that cannot suspend). */
export async function resolveSlot<P>(slot: ComponentType<P>): Promise<ComponentType<P>> {
  return "preload" in slot && typeof slot.preload === "function"
    ? await (slot.preload as () => Promise<ComponentType<P>>)()
    : slot;
}
