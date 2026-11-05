import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { SEARCH_MIN_CHARS } from "../../config/limits";
import { EXPLORE_SEGMENT, VIEW_COOKIE } from "../tenant/rewrites";
import { decodeFilters, encodeFilters, type MenuFilters } from "./filters";
import {
  addPick,
  changeQty,
  parseStoredPicks,
  picksStorageKey,
  prunePicks,
  type StoredPick,
} from "./picks";
import { menuStatus } from "./schedule";
import { searchItems } from "./search";
import type { ItemView, MenuView } from "./view";

/**
 * Client core of the menu (ADR-0003, ADR-0005, D-08). The page is static: everything that depends
 * on the guest's clock, address bar or browser storage is read here, through
 * useSyncExternalStore, so the server render (no clock, no storage) and the first client render
 * agree and the real values arrive right after hydration. Themes render; these hooks decide.
 */

// ── Clock ───────────────────────────────────────────────────────────────────────────────────
const MINUTE = 60_000;
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | undefined;

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  clockTimer ??= setInterval(() => {
    clockListeners.forEach((notify) => {
      notify();
    });
  }, MINUTE / 4);
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

/** The current minute (null during the server render and hydration). */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / MINUTE),
    () => null,
  );
  return useMemo(() => (minute === null ? null : new Date(minute * MINUTE)), [minute]);
}

/** BR-MNU-001/002: each menu's status now; open menus first, in their own order. Null before hydration. */
export function useActiveMenus(menus: readonly MenuView[], timeZone: string) {
  const now = useNow();
  return useMemo(() => {
    if (!now) return null;
    const rated = menus.map((menu) => ({
      menu,
      status: menuStatus(menu.schedule, menu.outsideWindow, now, timeZone),
    }));
    return [
      ...rated.filter((entry) => entry.status.state === "open"),
      ...rated.filter((entry) => entry.status.state !== "open"),
    ];
  }, [menus, now, timeZone]);
}

// ── Address bar ─────────────────────────────────────────────────────────────────────────────
const LOCATION_EVENT = "kartela:konum";

function subscribeLocation(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener(LOCATION_EVENT, listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener(LOCATION_EVENT, listener);
  };
}

function useSearchParam(name: string): string | null {
  return useSyncExternalStore(
    subscribeLocation,
    () => new URLSearchParams(window.location.search).get(name),
    () => null,
  );
}

function replaceSearchParam(name: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(LOCATION_EVENT));
}

/** REQ-012: filters live in ?filtre= so a filtered menu can be shared and survives a reload. */
export function useMenuFilters() {
  const param = useSearchParam("filtre");
  const filters = useMemo(() => decodeFilters(param), [param]);
  const setFilters = useCallback((next: MenuFilters) => {
    replaceSearchParam("filtre", encodeFilters(next) || null);
  }, []);
  return { filters, setFilters };
}

/** BR-BGL-001: the QR context (?b=M12) applies only when the venue knows the code. */
export function useVenueContext(knownCodes: readonly string[]): string | null {
  const code = useSearchParam("b");
  return code !== null && knownCodes.includes(code) ? code : null;
}

// ── Search, configurator ────────────────────────────────────────────────────────────────────
/** REQ-012: Turkish-aware instant search; `results` is null below the minimum length (P-07). */
export function useMenuSearch(items: readonly ItemView[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchItems(items, query, SEARCH_MIN_CHARS), [items, query]);
  return { query, setQuery, results };
}

// ── Seçtiklerim (browser storage) ───────────────────────────────────────────────────────────
const STORAGE_EVENT = "kartela:secim";

function subscribeStorage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(STORAGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(STORAGE_EVENT, listener);
  };
}

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // storage blocked (private mode): the list simply lives for the page view
  }
}

function writeStorage(key: string, picks: readonly StoredPick[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(picks));
  } catch {
    // Storage full or blocked: nothing to do; the guest still sees the list until reload.
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/** REQ-013, BR-SEC-001: per-venue list, 24 hours; quantities merge for identical choices. */
export function usePicks(venueSlug: string) {
  const key = picksStorageKey(venueSlug);
  const raw = useSyncExternalStore(
    subscribeStorage,
    () => readStorage(key),
    () => null,
  );
  // Only with something stored: on the server (and while hydrating) there is no clock to read.
  const picks = useMemo(
    () => (raw === null ? [] : prunePicks(parseStoredPicks(raw), new Date())),
    [raw],
  );
  return {
    picks,
    count: picks.reduce((sum, pick) => sum + pick.qty, 0),
    add: (pick: Omit<StoredPick, "key" | "qty" | "addedAt">) => {
      writeStorage(key, addPick(picks, pick, new Date()));
    },
    changeQty: (pickKey: string, delta: number) => {
      writeStorage(key, changeQty(picks, pickKey, delta));
    },
    clear: () => {
      writeStorage(key, []);
    },
  };
}

// ── View (Hızlı ↔ Keşfet) ───────────────────────────────────────────────────────────────────
/**
 * Remembers the guest's view in a cookie the host rewrites read (ADR-0002 v2): next time the QR
 * opens the venue's home, "kesfet" lands on Keşfet with no extra round trip.
 */
export function rememberView(view: "hizli" | "kesfet") {
  const value = view === "kesfet" ? EXPLORE_SEGMENT : "hizli";
  document.cookie = `${VIEW_COOKIE}=${value}; path=/; max-age=${String(60 * 60 * 24 * 180)}; samesite=lax`;
}
