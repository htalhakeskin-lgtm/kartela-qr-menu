"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { formatTime } from "../../lib/format";
import { SW_IMAGE_HOSTS, SW_STORED_AT_HEADER, SW_WARM_MESSAGE } from "../routes/sw-protocol";

/**
 * Offline support of a venue page (REQ-017, ADR-0005 §7, D-13), in every theme's root layout:
 * registers the venue's service worker and, while the device is offline, shows "Çevrimdışı ·
 * son güncelleme 14:05" above the page.
 *
 * The worker registers only on the venue's own domain: on a path-prefixed preview (/m/…) or a
 * ?mekan= preview the origin is the platform's, and a worker at its root would take over the
 * platform. The first visit loads before the worker exists, so the page then hands it its own
 * address and the files it loaded ("warm"); later visits pass through the worker anyway.
 */

function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

/** The page's address as the worker stores it (no fragment). */
const pageKey = () => window.location.href.split("#")[0] ?? window.location.href;

function loadedFiles(): string[] {
  const names = performance.getEntriesByType("resource").map((entry) => entry.name);
  return names.filter(
    (name) =>
      name.includes("/_next/static/") ||
      SW_IMAGE_HOSTS.some((host) => name.startsWith(`https://${host}/`)),
  );
}

export function OfflineSupport({
  hosts,
  labels,
}: {
  /** The venue's own host names (domains + {slug}.localhost). */
  hosts: readonly string[];
  labels: { offline: string; lastUpdate: string };
}) {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !hosts.includes(window.location.hostname)) return;
    const controlled = Boolean(navigator.serviceWorker.controller);
    let done = false;
    const register = () => {
      if (done) return;
      done = true;
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(async () => {
          if (controlled) return;
          const registration = await navigator.serviceWorker.ready;
          registration.active?.postMessage({
            type: SW_WARM_MESSAGE,
            urls: [pageKey(), ...loadedFiles()],
          });
        })
        .catch(() => undefined); // no worker: the page works as before, just not offline
    };
    // Not while the page is still painting: on the first touch, key or scroll, or three seconds
    // after hydration. The worker's install and warm-up requests would otherwise compete with the
    // menu's first paint (and Lighthouse counts them against it).
    const events = ["pointerdown", "keydown", "scroll"] as const;
    for (const event of events)
      window.addEventListener(event, register, { once: true, passive: true });
    const timer = window.setTimeout(register, 3000);
    return () => {
      window.clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, register);
    };
  }, [hosts]);

  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [storedAt, setStoredAt] = useState<string | null>(null);
  useEffect(() => {
    if (online || !("caches" in window)) return;
    void caches.match(pageKey(), { ignoreVary: true }).then((response) => {
      setStoredAt(response?.headers.get(SW_STORED_AT_HEADER) ?? null);
    });
  }, [online]);

  if (online) return null;
  return (
    <p role="status" className="bg-foreground px-4 py-2 text-center text-sm text-background">
      {labels.offline}
      {storedAt ? (
        <>
          {" · "}
          {labels.lastUpdate} <span className="tabular-nums">{formatTime(storedAt)}</span>
        </>
      ) : null}
    </p>
  );
}
