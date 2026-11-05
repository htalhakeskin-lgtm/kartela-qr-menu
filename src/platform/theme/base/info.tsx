import { formatPhone } from "../../../lib/format";
import { uiText } from "../../i18n/ui";
import type { VenueView } from "../../menu/view";
import type { ThemeSlots } from "../contract";
import { OpeningHoursTable } from "./opening-hours";
import { SiteFooter } from "./site-footer";
import { T } from "./text";

/**
 * Information page (SCR-005, D-11): address with a map link (a plain link, no map script),
 * opening hours, tap-to-call and WhatsApp, Wi-Fi, questions, the legal notes — including "no
 * service, table or cover charge", which belongs here and on printed lists, not in the menu
 * (BR-YSL-001, K-21). A server component inside the theme's shell.
 */
/** Only the slots the page renders (see info-slots.ts). */
export type InfoSlots = Pick<ThemeSlots, "Shell" | "LegalNote">;

export function InfoPage({ venue, slots }: { venue: VenueView; slots: InfoSlots }) {
  const ui = uiText(venue.locale);
  const info = venue.info;
  const section = "border-t border-border py-8";
  return (
    <slots.Shell venue={venue} view="bilgi">
      <main className="mx-auto max-w-[40rem] px-4 pb-16">
        <h1 className="pt-10 text-4xl font-semibold tracking-tight md:pt-16">{ui.info}</h1>
        {info?.description ? (
          <p className="mt-3 text-lg text-muted-foreground">
            <T text={info.description} page={venue.locale} />
          </p>
        ) : null}

        {info?.address ? (
          <section aria-labelledby="adres" className={`mt-8 ${section}`}>
            <h2 id="adres" className="text-lg font-semibold">
              {ui.address}
            </h2>
            <p className="mt-2">{info.address}</p>
            {info.mapUrl ? (
              <a
                href={info.mapUrl}
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4"
              >
                {ui.openMap}
              </a>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="saatler" className={section}>
          <h2 id="saatler" className="text-lg font-semibold">
            {ui.hours}
          </h2>
          <div className="mt-2">
            <OpeningHoursTable
              hours={info?.hours ?? {}}
              locale={venue.locale}
              timeZone={venue.timeZone}
            />
          </div>
        </section>

        {info?.phone || info?.whatsapp ? (
          <section aria-labelledby="iletisim" className={section}>
            <h2 id="iletisim" className="text-lg font-semibold">
              {ui.contact}
            </h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              {info.phone ? (
                <a
                  href={`tel:${info.phone}`}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
                >
                  {ui.call} <span dir="ltr">{formatPhone(info.phone)}</span>
                </a>
              ) : null}
              {info.whatsapp ? (
                <a
                  href={`https://wa.me/${info.whatsapp.slice(1)}`}
                  rel="noopener noreferrer"
                  className="flex min-h-12 flex-1 items-center justify-center rounded-md border border-border px-4 font-semibold"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
          </section>
        ) : null}

        {info?.wifi ? (
          <section aria-labelledby="wifi" className={section}>
            <h2 id="wifi" className="text-lg font-semibold">
              Wi-Fi
            </h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{ui.wifiNetwork}</dt>
              <dd className="font-medium">
                <bdi dir="ltr">{info.wifi.network}</bdi>
              </dd>
              {info.wifi.password ? (
                <>
                  <dt className="text-muted-foreground">{ui.wifiPassword}</dt>
                  <dd className="font-medium tabular-nums">
                    <bdi dir="ltr">{info.wifi.password}</bdi>
                  </dd>
                </>
              ) : null}
            </dl>
          </section>
        ) : null}

        {info && info.faq.length > 0 ? (
          <section aria-labelledby="sss" className={section}>
            <h2 id="sss" className="text-lg font-semibold">
              {ui.faq}
            </h2>
            <div className="mt-2 divide-y divide-border">
              {info.faq.map((entry) => (
                <details key={entry.q.text} className="group py-2">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-medium">
                    <T text={entry.q} page={venue.locale} />
                    <span aria-hidden="true" className="text-muted-foreground group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-2 text-muted-foreground">
                    <T text={entry.a} page={venue.locale} />
                  </p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <slots.LegalNote venue={venue} />
        <SiteFooter venue={venue} />
      </main>
    </slots.Shell>
  );
}
