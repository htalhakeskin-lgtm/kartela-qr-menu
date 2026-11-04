import type { Page } from "@playwright/test";

/**
 * Layout checks shared by the public and panel specs (07-mobil §10): horizontal overflow,
 * touch targets ≥ 44 px, inputs ≥ 16 px.
 */

const MIN_TARGET = 44;

export async function findOverflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    if (root.scrollWidth <= root.clientWidth) return null;
    const offenders = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => el.getBoundingClientRect().right > root.clientWidth + 1)
      .slice(0, 5)
      .map(
        (el) =>
          el.tagName.toLowerCase() +
          (el.id ? `#${el.id}` : "") +
          [...el.classList]
            .slice(0, 3)
            .map((name) => `.${name}`)
            .join(""),
      );
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, offenders };
  });
}

export async function findSmallTargets(page: Page) {
  return page.evaluate((min) => {
    const interactive = document.querySelectorAll<HTMLElement>(
      'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])',
    );
    return [...interactive]
      .filter((el) => {
        const style = getComputedStyle(el);
        if (
          style.visibility === "hidden" ||
          style.display === "none" ||
          el.closest("[aria-hidden='true']")
        )
          return false;
        // Inline links inside running text are exempt (WCAG 2.5.8 inline exception); table cells,
        // description details and the map's attribution line hold running text too.
        if (
          el.tagName === "A" &&
          el.closest("p, li, td, dd, .maplibregl-ctrl-attrib-inner") &&
          style.display === "inline"
        )
          return false;
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return false;
        // Visually hidden until focused (sr-only skip link): not a touch target in this state.
        if (box.width <= 1 && box.height <= 1) return false;
        // A checkbox / radio inside its label: the whole label is the target (WCAG 2.5.8).
        const label = el.closest("label");
        if (label && el.matches("input[type=checkbox], input[type=radio]")) {
          const area = label.getBoundingClientRect();
          return Math.round(area.width) < min || Math.round(area.height) < min;
        }
        // Rounded: emulated phones report 44 px as 43.999… (device-pixel scaling).
        return Math.round(box.width) < min || Math.round(box.height) < min;
      })
      .slice(0, 10)
      .map(
        (el) =>
          `${el.tagName.toLowerCase()} "${(el.textContent.trim() || (el.getAttribute("aria-label") ?? "")).slice(0, 30)}"`,
      );
  }, MIN_TARGET);
}

export async function findSmallInputs(page: Page) {
  return page.evaluate(() =>
    // Only fields people type into: iOS zooms on focus of those, not on checkboxes or radios.
    [
      ...document.querySelectorAll<HTMLElement>(
        "input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea",
      ),
    ]
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16) // eslint-disable-line no-restricted-globals -- CSS pixel value, not money
      .map((el) => el.getAttribute("name") ?? el.tagName.toLowerCase()),
  );
}
