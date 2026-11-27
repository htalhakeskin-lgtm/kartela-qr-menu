"use client";

import { type ReactNode, useActionState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { Field, FormAlert, TextArea } from "@/components/panel/ui";

import { saveSettingsAction } from "./actions";

/**
 * SCR-117 settings form. Uncontrolled inputs with the stored values; after a failed save the
 * submitted values come back from the action, so nothing typed is lost. The save button sits in
 * a bar at the bottom of the screen on a phone (thumb zone).
 */
const LOCALE_NAMES: Record<string, string> = {
  tr: "Türkçe",
  en: "İngilizce",
  ar: "Arapça",
  ru: "Rusça",
  de: "Almanca",
};

function Section({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-border bg-surface p-4 md:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden="true" className="text-base font-semibold">
        {title}
      </h2>
      {lead ? <p className="mt-1 text-sm text-muted-foreground">{lead}</p> : null}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

export function SettingsForm({
  venueId,
  slug,
  version,
  locales,
  weekdays,
  initial,
}: {
  venueId: string;
  slug: string;
  version: number;
  locales: string[];
  weekdays: readonly (readonly [number, string])[];
  initial: Record<string, string>;
}) {
  const [state, action] = useActionState(saveSettingsAction, null);
  const value = (name: string) => state?.values?.[name] ?? initial[name] ?? "";
  const error = (name: string) => state?.fieldErrors?.[name];
  const translations = (prefix: string, label: string, max: number, rows: number) =>
    locales.map((locale) => (
      <TextArea
        key={`${prefix}_${locale}`}
        label={`${label} (${LOCALE_NAMES[locale] ?? locale})`}
        name={`${prefix}_${locale}`}
        defaultValue={value(`${prefix}_${locale}`)}
        maxLength={max}
        rows={rows}
        lang={locale}
        dir={locale === "ar" ? "rtl" : undefined}
        error={error(`${prefix}_${locale}`)}
      />
    ));

  return (
    <form action={action} className="flex flex-col gap-4 pb-24 md:pb-0">
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="mekan" value={slug} />
      <input type="hidden" name="surum" value={version} />
      <FormAlert message={state?.message} />

      <Section title="Tanıtım" lead="Bilgi sayfasının başında ve arama sonuçlarında görünür.">
        {translations("aciklama", "Kısa tanıtım", 400, 4)}
      </Section>

      <Section title="Adres ve iletişim">
        <Field
          label="Adres"
          name="adres"
          autoComplete="street-address"
          maxLength={200}
          defaultValue={value("adres")}
          error={error("adres")}
        />
        <Field
          label="Harita bağlantısı"
          name="harita"
          type="url"
          inputMode="url"
          maxLength={500}
          placeholder="https://"
          defaultValue={value("harita")}
          error={error("harita")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Telefon"
            name="telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={30}
            hint="Örnek biçim: 0532 123 45 67"
            defaultValue={value("telefon")}
            error={error("telefon")}
          />
          <Field
            label="WhatsApp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            maxLength={30}
            defaultValue={value("whatsapp")}
            error={error("whatsapp")}
          />
        </div>
        <Field
          label="E-posta"
          name="eposta"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          defaultValue={value("eposta")}
          error={error("eposta")}
        />
      </Section>

      <Section
        title="Çalışma saatleri"
        lead="Gece yarısından sonra kapanan günlerde kapanış saati ertesi güne aittir (ör. 18:00–02:00)."
      >
        <ul className="flex flex-col divide-y divide-border">
          {weekdays.map(([day, name]) => {
            const prefix = `gun${String(day)}`;
            const closed = value(`${prefix}Kapali`) === "on";
            return (
              <li
                key={day}
                className="grid grid-cols-2 gap-x-3 gap-y-2 py-3 first:pt-0 sm:grid-cols-[8rem_1fr_1fr_auto] sm:items-end"
              >
                <p className="col-span-2 font-medium sm:col-span-1 sm:pb-3">{name}</p>
                <Field
                  label="Açılış"
                  name={`${prefix}Acilis`}
                  type="time"
                  defaultValue={value(`${prefix}Acilis`)}
                  error={error(`${prefix}Acilis`)}
                  aria-label={`${name} açılış`}
                />
                <Field
                  label="Kapanış"
                  name={`${prefix}Kapanis`}
                  type="time"
                  defaultValue={value(`${prefix}Kapanis`)}
                  aria-label={`${name} kapanış`}
                />
                <label className="col-span-2 flex min-h-11 items-center gap-3 text-sm sm:col-span-1">
                  <input
                    type="checkbox"
                    name={`${prefix}Kapali`}
                    defaultChecked={closed}
                    className="size-5 accent-primary"
                  />
                  Kapalı
                </label>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        title="Wi-Fi"
        lead="Bilgi sayfasında misafirlere gösterilir. Boş bırakırsanız görünmez."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Ağ adı"
            name="wifiAg"
            maxLength={64}
            autoComplete="off"
            defaultValue={value("wifiAg")}
            error={error("wifiAg")}
          />
          <Field
            label="Parola"
            name="wifiParola"
            maxLength={64}
            autoComplete="off"
            spellCheck={false}
            defaultValue={value("wifiParola")}
            error={error("wifiParola")}
          />
        </div>
      </Section>

      <Section
        title="Yasal notlar"
        lead="Mekânın kendi alerjen beyanı. Boş bırakırsanız genel beyan gösterilir."
      >
        {translations("alerjen", "Alerjen beyanı", 600, 4)}
      </Section>

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface px-4 py-3 md:static md:border-0 md:bg-transparent md:p-0">
        <SubmitButton pending="Kaydediliyor…" className="w-full md:w-auto">
          Kaydet
        </SubmitButton>
      </div>
    </form>
  );
}
