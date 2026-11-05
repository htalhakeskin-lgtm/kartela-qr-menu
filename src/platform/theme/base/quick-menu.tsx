"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { uiText } from "../../i18n/ui";
import { availabilityStatus, businessDate, dailyEntries } from "../../menu/availability";
import { activeFilterCount, matchFilters } from "../../menu/filters";
import { useActiveMenus, useMenuFilters, useMenuSearch, useNow, usePicks } from "../../menu/hooks";
import type { MenuStatus } from "../../menu/schedule";
import type { ItemView, MenuView, SectionView, VenueView } from "../../menu/view";
import { itemIndex } from "../../menu/view";
import type { ItemCardVariant, QuickLayout } from "../contract";
import { preloadSlots } from "../lazy-slot";
import { Sheet } from "./sheet";
import { localeHome, pageHref, useVenueBase } from "./shell";
import { SiteFooter } from "./site-footer";
import { type QuickMenuSlots } from "./slots";
import { DIMMED, T } from "./text";

/**
 * The quick menu (SCR-001, D-09): the page every theme renders with its slots. Static HTML first
 * (every menu, section and product is in the server render); after hydration the clock orders the
 * menus, sold-out products move to the end of their section, filters and search narrow the list.
 */

const ITEM_HASH = "#urun-";

function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

/** The product whose sheet is open, from the address: #urun-{slug} links straight to it. */
function useOpenItemSlug(): string | null {
  return useSyncExternalStore(
    subscribeHash,
    () =>
      window.location.hash.startsWith(ITEM_HASH)
        ? decodeURIComponent(window.location.hash.slice(ITEM_HASH.length))
        : null,
    () => null,
  );
}

/** SCR-004: Seçtiklerim has an address of its own (#sectiklerim): shareable on the table, back closes it. */
const PICKS_HASH = "#sectiklerim";

function usePicksOpen(): boolean {
  return useSyncExternalStore(
    subscribeHash,
    () => window.location.hash === PICKS_HASH,
    () => false,
  );
}

function setHash(hash: string | null, mode: "push" | "replace") {
  const url = hash ?? window.location.pathname + window.location.search;
  if (mode === "push") window.history.pushState(window.history.state, "", url);
  else window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function useLayout(fallback: QuickLayout): QuickLayout {
  const param = useSyncExternalStore(
    () => () => undefined,
    () => new URLSearchParams(window.location.search).get("yerlesim"),
    () => null,
  );
  return param === "liste" || param === "kart" || param === "izgara" ? param : fallback;
}

type Panel = "search" | "filter" | null;

/** Line icons (1.5 px stroke, plan §11.6), drawn here: four icons are not worth a dependency. */
const ICONS = {
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4",
  filter: "M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6",
  picks: "M7 4h10v16l-5-3-5 3V4Z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-11v6m0-9v.01",
} as const;

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

/**
 * Fetches the lazy sheets' code once the page is up: on the first touch, key or scroll, or two
 * seconds after hydration, whichever comes first. Late enough not to compete with the first
 * paint, early enough that the first tap rarely waits.
 */
function usePreloadedSheets(slots: QuickMenuSlots) {
  useEffect(() => {
    const sheets = [
      slots.ItemSheet,
      slots.OptionPicker,
      slots.ItemFacts,
      slots.Picks,
      slots.FilterPanel,
    ];
    let done = false;
    const preload = () => {
      if (done) return;
      done = true;
      preloadSlots(sheets);
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    for (const event of events)
      window.addEventListener(event, preload, { once: true, passive: true });
    const timer = window.setTimeout(preload, 2000);
    return () => {
      window.clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, preload);
    };
  }, [slots]);
}

export function QuickMenu({
  venue,
  slots,
  layout: defaultLayout = "liste",
}: {
  venue: VenueView;
  slots: QuickMenuSlots;
  layout?: QuickLayout;
}) {
  const ui = uiText(venue.locale);
  const base = useVenueBase(venue.slug);
  const now = useNow();
  const active = useActiveMenus(venue.menus, venue.timeZone);
  const { filters, setFilters } = useMenuFilters();
  const search = useMenuSearch(venue.items);
  const picks = usePicks(venue.slug);
  const layout = useLayout(defaultLayout);
  const openSlug = useOpenItemSlug();
  const picksOpen = usePicksOpen();
  const [panel, setPanel] = useState<Panel>(null);
  const items = useMemo(() => itemIndex(venue), [venue]);
  usePreloadedSheets(slots);
  const bySlug = useMemo(() => new Map(venue.items.map((item) => [item.slug, item])), [venue]);

  const statusOf = useCallback(
    (item: ItemView) => (now ? availabilityStatus(item.availability, now, venue.timeZone) : null),
    [now, venue.timeZone],
  );
  const shown = useCallback(
    (item: ItemView) => {
      const status = statusOf(item);
      return matchFilters(item, filters).match && (status?.visible ?? true);
    },
    [filters, statusOf],
  );

  const openItem = (item: ItemView) => {
    window.history.pushState(
      window.history.state,
      "",
      `${ITEM_HASH}${encodeURIComponent(item.slug)}`,
    );
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  const closeItem = () => {
    if (window.location.hash.startsWith(ITEM_HASH)) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  };
  /** From inside a sheet (a pairing, a set component): replaces the open product. */
  const switchItem = (id: string) => {
    const item = items.get(id);
    if (item) {
      window.history.replaceState(
        window.history.state,
        "",
        `${ITEM_HASH}${encodeURIComponent(item.slug)}`,
      );
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  };

  // Menus: open ones first once the clock is known; "hide" menus out of their window disappear.
  const menus: { menu: MenuView; status: MenuStatus | null }[] = (
    active ?? venue.menus.map((menu) => ({ menu, status: null }))
  )
    .filter(
      ({ menu, status }) => !(status && status.state !== "open" && menu.outsideWindow === "hide"),
    )
    .filter(({ menu }) => menu.access === "public");
  const serving = active?.find((entry) => entry.status.state === "open")?.menu;
  const today = now ? businessDate(now, venue.timeZone) : null;

  const card = (item: ItemView, variant: ItemCardVariant) => (
    <slots.ItemCard
      item={item}
      variant={variant}
      venue={venue}
      status={statusOf(item)}
      onOpen={() => {
        openItem(item);
      }}
    />
  );

  const list = (placed: { item: ItemView; featured: boolean }[]) => {
    const visible = placed.filter(({ item }) => shown(item));
    // REQ-008: sold-out products go to the end of their section, still visible and marked.
    const ordered = [
      ...visible.filter(({ item }) => !statusOf(item)?.soldOut),
      ...visible.filter(({ item }) => statusOf(item)?.soldOut),
    ];
    const featured = ordered.filter((entry) => entry.featured);
    const rest = ordered.filter((entry) => !entry.featured);
    return (
      <>
        {featured.map(({ item }) => (
          <div key={item.id} className="mt-4">
            {card(item, "one-cikan")}
          </div>
        ))}
        {rest.length > 0 ? (
          layout === "liste" ? (
            <ul className="divide-y divide-border">
              {rest.map(({ item }) => (
                <li key={item.id}>{card(item, "satir")}</li>
              ))}
            </ul>
          ) : (
            <ul
              className={`mt-4 grid gap-3 ${layout === "kart" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}
            >
              {rest.map(({ item }) => (
                <li key={item.id}>{card(item, layout === "kart" ? "kart" : "izgara")}</li>
              ))}
            </ul>
          )
        ) : null}
      </>
    );
  };

  const placedIn = (section: SectionView) =>
    section.items.flatMap(({ itemId, featured }) => {
      const item = items.get(itemId);
      return item ? [{ item, featured }] : [];
    });

  const sectionBlock = (section: SectionView, level: 2 | 3) => (
    <section key={section.id}>
      <slots.SectionHeader section={section} venue={venue} level={level} />
      {list(placedIn(section))}
      {section.children.map((child) => sectionBlock(child, 3))}
    </section>
  );

  const menuBlock = ({
    menu,
    status: menuStatus,
  }: {
    menu: MenuView;
    status: MenuStatus | null;
  }) => {
    const dimmed = menuStatus !== null && menuStatus.state !== "open";
    if (menu.kind === "daily") {
      const entries = today ? dailyEntries(menu.daily, today) : [];
      return (
        <section
          key={menu.id}
          aria-labelledby={`menu-${menu.id}`}
          className={dimmed ? DIMMED : undefined}
        >
          <h2
            id={`menu-${menu.id}`}
            className="scroll-mt-32 pt-10 text-2xl font-semibold tracking-tight md:pt-16"
          >
            <T text={menu.name} page={venue.locale} />
          </h2>
          {menuStatus ? <slots.MenuNotice menu={menu} status={menuStatus} venue={venue} /> : null}
          {today === null ? null : entries.length === 0 ? (
            <slots.EmptyState reason="daily" venue={venue} />
          ) : (
            list(
              entries.flatMap(({ itemId }) => {
                const item = items.get(itemId);
                return item ? [{ item, featured: false }] : [];
              }),
            )
          )}
        </section>
      );
    }
    return (
      <section
        key={menu.id}
        aria-labelledby={`menu-${menu.id}`}
        className={dimmed ? DIMMED : undefined}
      >
        <h2
          id={`menu-${menu.id}`}
          className="scroll-mt-32 pt-10 text-2xl font-semibold tracking-tight md:pt-16"
        >
          <T text={menu.name} page={venue.locale} />
        </h2>
        {menuStatus ? <slots.MenuNotice menu={menu} status={menuStatus} venue={venue} /> : null}
        {menu.sections.map((section) => sectionBlock(section, 3))}
      </section>
    );
  };

  const anyShown = venue.items.some(shown);
  const categories = menus.flatMap(({ menu }) =>
    menu.sections.map((section) => ({ id: section.id, name: section.name })),
  );
  const openItemView = openSlug ? bySlug.get(openSlug) : undefined;
  const filterCount = activeFilterCount(filters);

  return (
    <slots.Shell
      venue={venue}
      view="hizli"
      headerCenter={serving ? <T text={serving.name} page={venue.locale} /> : null}
    >
      {/* Phone: the category bar sticks under the top bar; desktop (plan §11.4): a 240 px sticky
          index on the left, the menu in a 720 px column. */}
      <div className="mx-auto max-w-[45rem] px-4 lg:grid lg:max-w-[64rem] lg:grid-cols-[15rem_minmax(0,45rem)] lg:gap-12">
        <slots.CategoryBar sections={categories} venue={venue} />
        <main className="pb-32">
          <h1 className="sr-only">
            {venue.name} · {ui.menu}
          </h1>
          {anyShown ? (
            menus.map((entry) => menuBlock(entry))
          ) : (
            <slots.EmptyState reason="filter" venue={venue} />
          )}
          <slots.LegalNote venue={venue} />
          <SiteFooter venue={venue} />
        </main>
      </div>

      <nav
        aria-label={ui.menu}
        className="kt-bottom-bar fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background"
      >
        <div className="mx-auto grid h-14 max-w-[45rem] grid-cols-4 lg:max-w-[64rem] lg:grid-cols-[15rem_repeat(4,minmax(0,11.25rem))] lg:gap-0 lg:px-4">
          <span className="hidden lg:block" aria-hidden="true" />
          {(
            [
              ["search", ui.search, null, ICONS.search],
              ["filter", ui.filter, filterCount > 0 ? filterCount : null, ICONS.filter],
              ["picks", ui.picks, picks.count > 0 ? picks.count : null, ICONS.picks],
            ] as const
          ).map(([key, label, badge, icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === "picks") setHash(PICKS_HASH, "push");
                else setPanel(key);
              }}
              className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs sm:flex-row sm:gap-1.5 sm:text-sm"
            >
              <Icon path={icon} />
              <span className="flex items-center gap-1">
                {label}
                {badge !== null ? (
                  <span className="min-w-5 rounded-full bg-primary px-1.5 text-xs leading-5 text-primary-foreground tabular-nums">
                    {badge}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
          <a
            href={pageHref(localeHome(base, venue.locale, venue.defaultLocale), "bilgi")}
            className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs sm:flex-row sm:gap-1.5 sm:text-sm"
          >
            <Icon path={ICONS.info} />
            {ui.info}
          </a>
        </div>
      </nav>

      {/* Sheets load on first use (lazy slots); nothing shows until their code is in. */}
      <Suspense fallback={null}>
        {panel === "search" ? (
          <Sheet
            label={ui.search}
            closeLabel={ui.close}
            onClose={() => {
              setPanel(null);
            }}
          >
            <slots.SearchField value={search.query} onChange={search.setQuery} venue={venue} />
            {search.results === null ? null : search.results.length === 0 ? (
              <slots.EmptyState reason="search" venue={venue} />
            ) : (
              <ul className="mt-2 divide-y divide-border">
                {search.results.map((item) => (
                  <li key={item.id}>{card(item, "satir")}</li>
                ))}
              </ul>
            )}
          </Sheet>
        ) : null}
        {panel === "filter" ? (
          <Sheet
            label={ui.filter}
            closeLabel={ui.close}
            onClose={() => {
              setPanel(null);
            }}
            footer={
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ diets: [], excludeAllergens: [], maxSpice: null });
                  }}
                  className="min-h-12 flex-1 rounded-md border border-border text-sm"
                >
                  {ui.clearFilters}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPanel(null);
                  }}
                  className="min-h-12 flex-1 rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {ui.showResults(venue.items.filter(shown).length)}
                </button>
              </div>
            }
          >
            <slots.FilterPanel filters={filters} onChange={setFilters} venue={venue} />
          </Sheet>
        ) : null}
        {picksOpen ? (
          <Sheet
            label={ui.picks}
            closeLabel={ui.close}
            onClose={() => {
              if (window.location.hash === PICKS_HASH) setHash(null, "replace");
            }}
          >
            <slots.Picks venue={venue} />
          </Sheet>
        ) : null}
        {openItemView ? (
          <slots.ItemSheet
            key={openItemView.id}
            item={openItemView}
            venue={venue}
            status={statusOf(openItemView)}
            onClose={closeItem}
            onOpenItem={switchItem}
          />
        ) : null}
      </Suspense>
    </slots.Shell>
  );
}
