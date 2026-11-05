"use client";

import { uiText } from "../../i18n/ui";
import { localTime } from "../../menu/clock";
import { useNow } from "../../menu/hooks";
import type { OpeningHours } from "../../menu/types";
import type { Locale } from "../../tenant/registry-schema";

/** Weekday names in the page language: 2024-01-01 was a Monday. */
function weekdayNames(locale: Locale): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  return Array.from({ length: 7 }, (_, index) =>
    format.format(new Date(Date.UTC(2024, 0, 1 + index))),
  );
}

/**
 * Opening hours (SCR-005): one row per weekday in the venue's time zone, today's row marked once
 * the browser knows the day (the page itself is static).
 */
export function OpeningHoursTable({
  hours,
  locale,
  timeZone,
}: {
  hours: OpeningHours;
  locale: Locale;
  timeZone: string;
}) {
  const ui = uiText(locale);
  const now = useNow();
  const today = now ? localTime(now, timeZone).weekday : null;
  const names = weekdayNames(locale);
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-border">
        {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => {
          const windows = hours[day] ?? [];
          const isToday = day === today;
          return (
            <tr
              key={day}
              aria-current={isToday ? "date" : undefined}
              className={isToday ? "font-semibold" : undefined}
            >
              <th
                scope="row"
                className={`py-3 text-start ${isToday ? "font-semibold" : "font-normal"}`}
              >
                {names[day - 1]}
              </th>
              {/* The cell follows the page direction; only the times inside read left to right. */}
              <td className="py-3 text-end tabular-nums">
                {windows.length > 0 ? (
                  <bdi dir="ltr">
                    {windows.map((window) => `${window.open}–${window.close}`).join(", ")}
                  </bdi>
                ) : (
                  ui.closedDay
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
