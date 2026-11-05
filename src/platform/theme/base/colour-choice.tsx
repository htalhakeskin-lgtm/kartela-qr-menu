"use client";

import { useSyncExternalStore } from "react";

import { uiText } from "../../i18n/ui";
import type { Locale } from "../../tenant/registry-schema";
import { COLOUR_STORAGE_KEY } from "../pre-paint";

type Choice = "acik" | "koyu" | null;
const COLOUR_EVENT = "kartela:renk";

function read(): Choice {
  try {
    const value = window.localStorage.getItem(COLOUR_STORAGE_KEY);
    return value === "acik" || value === "koyu" ? value : null;
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener(COLOUR_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(COLOUR_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function choose(choice: Choice) {
  try {
    if (choice) window.localStorage.setItem(COLOUR_STORAGE_KEY, choice);
    else window.localStorage.removeItem(COLOUR_STORAGE_KEY);
  } catch {
    // Storage blocked: the choice lasts for this page view only.
  }
  if (choice) document.documentElement.setAttribute("data-renk", choice);
  else document.documentElement.removeAttribute("data-renk");
  window.dispatchEvent(new Event(COLOUR_EVENT));
}

/**
 * Light / dark / automatic (REQ-014): the guest's choice is written to <html data-renk> now and by
 * the pre-paint script on the next visit; "automatic" follows the system and, in themes with an
 * evening set, the venue's time of day.
 */
export function ColourChoice({ locale }: { locale: Locale }) {
  const ui = uiText(locale);
  const current = useSyncExternalStore(subscribe, read, () => null);
  const options: [Choice, string][] = [
    ["acik", ui.colourLight],
    ["koyu", ui.colourDark],
    [null, ui.colourAuto],
  ];
  return (
    <div role="group" aria-label={ui.colour} className="flex items-center gap-1">
      <span className="me-2 text-xs text-muted-foreground">{ui.colour}</span>
      {options.map(([choice, label]) => (
        <button
          key={label}
          type="button"
          aria-pressed={current === choice}
          onClick={() => {
            choose(choice);
          }}
          className={`min-h-11 min-w-11 rounded-full px-3 text-xs ${
            current === choice ? "bg-foreground text-background" : "text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
