"use client";

import { useActionState, useEffect, useState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { FormAlert } from "@/components/panel/ui";
import type { AvailabilityGroup, AvailabilityItem } from "@/server/panel/availability";

import {
  bringBackAction,
  countAction,
  limitAction,
  releaseAction,
  type RowState,
  soldOutAction,
} from "./actions";

/**
 * SCR-108 (phone first, plan §12 "en sık iş"): one row per product, one tap "Tükendi" (until the
 * day ends at 04:00); "Geri al" stays for 5 seconds; daily count ± in the thumb's reach; less
 * frequent settings (indefinite, count, oven times) behind "Ayrıntılar".
 */
const UNDO_MS = 5000;

const STATUS: Record<NonNullable<AvailabilityItem["soldOut"]>, string> = {
  day: "Tükendi · gün sonuna kadar",
  indefinite: "Tükendi · süresiz",
  count: "Tükendi · günlük adet bitti",
};

function Hidden({ venueId, itemId }: { venueId: string; itemId: string }) {
  return (
    <>
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="itemId" value={itemId} />
    </>
  );
}

function Status({ state }: { state: RowState }) {
  return (
    <>
      <FormAlert message={state?.message} />
      {state?.done ? (
        <p role="status" className="text-sm text-muted-foreground">
          {state.done}
        </p>
      ) : null}
    </>
  );
}

function Row({ venueId, item }: { venueId: string; item: AvailabilityItem }) {
  const [soldState, sold] = useActionState(soldOutAction, null);
  const [backState, back] = useActionState(bringBackAction, null);
  const [countState, count] = useActionState(countAction, null);
  const [limitState, limit] = useActionState(limitAction, null);
  const [releaseState, release] = useActionState(releaseAction, null);
  // "Geri al" for 5 seconds after a tap; the timer, not the render, ends the window.
  const [expiredAt, setExpiredAt] = useState<number | undefined>();
  const markedAt = soldState?.at;
  useEffect(() => {
    if (!markedAt) return;
    const timer = setTimeout(() => {
      setExpiredAt(markedAt);
    }, UNDO_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [markedAt]);
  const undo = Boolean(markedAt) && markedAt !== expiredAt;

  const marked = item.soldOut === "day" || item.soldOut === "indefinite";
  return (
    <li className="flex flex-col gap-3 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {item.soldOut ? STATUS[item.soldOut] : "Serviste"}
            {item.dailyLimit !== null
              ? ` · kalan ${String(item.remaining ?? item.dailyLimit)}/${String(item.dailyLimit)}`
              : ""}
            {item.releaseTimes.length > 0 ? ` · çıkış ${item.releaseTimes.join(", ")}` : ""}
          </p>
        </div>
        {marked ? (
          <form action={back}>
            <Hidden venueId={venueId} itemId={item.id} />
            <SubmitButton pending="…" variant="secondary">
              {undo ? "Geri al" : "Geri getir"}
              <span className="sr-only">: {item.name}</span>
            </SubmitButton>
          </form>
        ) : (
          <form action={sold}>
            <Hidden venueId={venueId} itemId={item.id} />
            <input type="hidden" name="sure" value="gun" />
            <SubmitButton pending="…" variant="danger">
              Tükendi<span className="sr-only">: {item.name}</span>
            </SubmitButton>
          </form>
        )}
      </div>

      {item.dailyLimit !== null ? (
        <form action={count} className="flex items-center gap-2">
          <Hidden venueId={venueId} itemId={item.id} />
          <SubmitButton pending="…" variant="secondary" name="fark" value="-1" className="min-w-11">
            <span aria-hidden="true">−</span>
            <span className="sr-only">Bir azalt: {item.name}</span>
          </SubmitButton>
          <span className="min-w-16 text-center font-mono tabular-nums" aria-live="polite">
            {String(item.remaining ?? item.dailyLimit)}/{String(item.dailyLimit)}
          </span>
          <SubmitButton pending="…" variant="secondary" name="fark" value="1" className="min-w-11">
            <span aria-hidden="true">+</span>
            <span className="sr-only">Bir artır: {item.name}</span>
          </SubmitButton>
        </form>
      ) : null}

      <Status state={soldState} />
      <Status state={backState} />
      <Status state={countState} />

      <details>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm">
          Ayrıntılar<span className="sr-only">: {item.name}</span>
        </summary>
        <div className="mt-2 flex flex-col gap-4 rounded-md bg-surface-muted p-3">
          {marked ? null : (
            <form action={sold}>
              <Hidden venueId={venueId} itemId={item.id} />
              <input type="hidden" name="sure" value="suresiz" />
              <SubmitButton pending="…" variant="secondary">
                Süresiz tükendi
              </SubmitButton>
            </form>
          )}
          <form action={limit} className="flex flex-wrap items-end gap-2">
            <Hidden venueId={venueId} itemId={item.id} />
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Günlük adet (boş: sınırsız)
              <input
                name="adet"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                defaultValue={item.dailyLimit ?? ""}
                className="min-h-11 w-28 rounded-md border border-control-border bg-surface px-3 text-base"
              />
            </label>
            <SubmitButton pending="…" variant="secondary">
              Kaydet
            </SubmitButton>
          </form>
          <Status state={limitState} />
          <form action={release} className="flex flex-wrap items-end gap-2">
            <Hidden venueId={venueId} itemId={item.id} />
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Fırından çıkış saatleri
              <input
                name="saatler"
                placeholder="08:00, 11:30"
                defaultValue={item.releaseTimes.join(", ")}
                className="min-h-11 w-44 rounded-md border border-control-border bg-surface px-3 text-base"
              />
            </label>
            <SubmitButton pending="…" variant="secondary">
              Kaydet
            </SubmitButton>
          </form>
          <Status state={releaseState} />
        </div>
      </details>
    </li>
  );
}

export function AvailabilityList({
  venueId,
  groups,
}: {
  venueId: string;
  groups: AvailabilityGroup[];
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("tr-TR");
  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !needle || item.name.toLocaleLowerCase("tr-TR").includes(needle),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 py-3 md:mx-0 md:px-0">
        <label htmlFor="urun-ara" className="sr-only">
          Ürün ara
        </label>
        <input
          id="urun-ara"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="Ürün ara"
          className="min-h-11 w-full rounded-md border border-control-border bg-surface px-3 text-base"
        />
      </div>
      {visible.length === 0 ? (
        <p className="mt-4 text-muted-foreground">Aramayla eşleşen ürün yok.</p>
      ) : (
        visible.map((group, index) => (
          <section key={group.title} aria-labelledby={`grup-${String(index)}`} className="mt-4">
            <h2
              id={`grup-${String(index)}`}
              className="text-sm font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {group.title}
            </h2>
            <ul className="divide-y divide-border">
              {group.items.map((item) => (
                <Row key={item.id} venueId={venueId} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
