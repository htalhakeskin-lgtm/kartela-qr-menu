"use server";

import { revalidatePath } from "next/cache";

import { formFields } from "@/lib/form-data";
import {
  bringBack,
  changeCount,
  copyPreviousDay,
  markSoldOut,
  saveDailyMenu,
  setDailyLimit,
  setReleaseTimes,
} from "@/server/panel/availability";

/** SCR-108 / SCR-109 actions; src/server/panel/availability.ts validates, authorizes, audits. */
export type RowState = { message: string | null; done?: string; at?: number } | null;

const text = (formData: FormData, name: string): string => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const refresh = () => {
  revalidatePath("/panel/[mekan]", "layout");
};

function answer(result: { ok: true } | { ok: false; message: string }, done: string): RowState {
  if (!result.ok) return { message: result.message };
  refresh();
  return { message: null, done, at: Date.now() };
}

export async function soldOutAction(_: RowState, formData: FormData): Promise<RowState> {
  const fields = formFields<Record<string, string>>(formData);
  const result = await markSoldOut(fields as never);
  return answer(result, fields.sure === "suresiz" ? "Süresiz tükendi" : "Gün sonuna kadar tükendi");
}

export async function bringBackAction(_: RowState, formData: FormData): Promise<RowState> {
  return answer(await bringBack(formFields(formData)), "Yeniden serviste");
}

export async function countAction(_: RowState, formData: FormData): Promise<RowState> {
  return answer(await changeCount(formFields(formData)), "Adet güncellendi");
}

export async function limitAction(_: RowState, formData: FormData): Promise<RowState> {
  return answer(await setDailyLimit(formFields(formData)), "Günlük adet kaydedildi");
}

export async function releaseAction(_: RowState, formData: FormData): Promise<RowState> {
  return answer(await setReleaseTimes(formFields(formData)), "Çıkış saatleri kaydedildi");
}

export async function dailyMenuAction(_: RowState, formData: FormData): Promise<RowState> {
  const result = await saveDailyMenu({
    venueId: text(formData, "venueId"),
    menuId: text(formData, "menuId"),
    onDate: text(formData, "onDate"),
    urunler: formData.getAll("urun").filter((value) => typeof value === "string"),
  });
  return answer(result, "Günün menüsü kaydedildi");
}

export async function copyDayAction(_: RowState, formData: FormData): Promise<RowState> {
  return answer(await copyPreviousDay(formFields(formData)), "Önceki günün menüsü kopyalandı");
}
