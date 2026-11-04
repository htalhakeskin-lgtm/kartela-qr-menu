"use client";

import { useEffect, useRef, useState } from "react";

import { uiText } from "../../i18n/ui";
import type { CategoryBarProps } from "../contract";
import { T } from "./text";

/**
 * Category bar slot (SCR-001): sticky, horizontally scrolling chips with 44 px targets; the chip
 * of the section in view is marked and kept visible. Plain anchor links: works without JavaScript.
 */
export function BaseCategoryBar({ sections, venue }: CategoryBarProps) {
  const [active, setActive] = useState<string | null>(null);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(`bolum-${section.id}`))
      .filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        const first = visible.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        )[0];
        if (first) setActive(first.target.id.replace("bolum-", ""));
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    targets.forEach((target) => {
      observer.observe(target);
    });
    return () => {
      observer.disconnect();
    };
  }, [sections]);

  useEffect(() => {
    if (!active) return;
    bar.current
      ?.querySelector(`[data-bolum="${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  if (sections.length === 0) return null;
  return (
    <nav
      ref={bar}
      aria-label={uiText(venue.locale).categories}
      className="kt-scroll-x sticky top-14 z-20 -mx-4 flex gap-1 overflow-x-auto border-b border-border bg-background px-2 lg:mx-0 lg:max-h-[calc(100dvh-3.5rem)] lg:flex-col lg:gap-0 lg:self-start lg:overflow-y-auto lg:border-b-0 lg:px-0 lg:pt-16"
    >
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#bolum-${section.id}`}
          data-bolum={section.id}
          aria-current={active === section.id ? "true" : undefined}
          className={`flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm whitespace-nowrap lg:border-s-2 lg:border-b-0 lg:py-2 lg:whitespace-normal ${
            active === section.id
              ? "border-accent font-semibold text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          <T text={section.name} page={venue.locale} />
        </a>
      ))}
    </nav>
  );
}
