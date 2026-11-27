"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/panel/submit-button";
import { FormAlert } from "@/components/panel/ui";

import { copyDayAction, dailyMenuAction, type RowState } from "../musaitlik/actions";

function Status({ state }: { state: RowState }) {
  return (
    <>
      <FormAlert message={state?.message} />
      {state?.done ? (
        <p role="status" className="rounded-md bg-surface-muted px-3 py-2.5 text-sm">
          {state.done}
        </p>
      ) : null}
    </>
  );
}

/** SCR-109: tick the day's products and save; or copy the previous day in one tap. */
export function DailyForm({
  venueId,
  menuId,
  onDate,
  items,
  selected,
}: {
  venueId: string;
  menuId: string;
  onDate: string;
  items: { id: string; name: string }[];
  selected: string[];
}) {
  const [state, save] = useActionState(dailyMenuAction, null);
  const [copyState, copy] = useActionState(copyDayAction, null);
  const chosen = new Set(selected);
  const ordered = [
    ...selected.flatMap((id) => items.filter((item) => item.id === id)),
    ...items.filter((item) => !chosen.has(item.id)),
  ];
  return (
    <div className="flex flex-col gap-4">
      <form action={copy} className="flex flex-col gap-2">
        <input type="hidden" name="venueId" value={venueId} />
        <input type="hidden" name="menuId" value={menuId} />
        <input type="hidden" name="onDate" value={onDate} />
        <SubmitButton pending="Kopyalanıyor…" variant="secondary" className="self-start">
          Önceki günü kopyala
        </SubmitButton>
        <Status state={copyState} />
      </form>
      <form action={save} className="flex flex-col gap-4 pb-24 md:pb-0">
        <input type="hidden" name="venueId" value={venueId} />
        <input type="hidden" name="menuId" value={menuId} />
        <input type="hidden" name="onDate" value={onDate} />
        <fieldset className="rounded-lg border border-border bg-surface p-4">
          <legend className="px-1 text-sm font-semibold">Bugünün ürünleri</legend>
          <ul className="flex flex-col divide-y divide-border">
            {ordered.map((item) => (
              <li key={item.id}>
                <label className="flex min-h-12 items-center gap-3">
                  <input
                    type="checkbox"
                    name="urun"
                    value={item.id}
                    defaultChecked={chosen.has(item.id)}
                    className="size-5 accent-primary"
                  />
                  {item.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <Status state={state} />
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface px-4 py-3 md:static md:border-0 md:bg-transparent md:p-0">
          <SubmitButton pending="Kaydediliyor…" className="w-full md:w-auto">
            Günün menüsünü kaydet
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
