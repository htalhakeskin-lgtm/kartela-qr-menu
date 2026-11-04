import { type RuleCode, ruleMessages } from "@/config/rules";

/**
 * Server actions never throw to the client; they return a Result (05-sunucu-ve-api §4).
 */
export type FieldErrors = Record<string, string[] | undefined>;

export type Ok<T> = { ok: true; data: T };
export type Fail = {
  ok: false;
  code: FailCode;
  message: string;
  fieldErrors?: FieldErrors;
  errorId?: string;
};
export type Result<T> = Ok<T> | Fail;

const technicalMessages = {
  validation: "Lütfen işaretli alanları kontrol edin.",
  unauthorized: "Bu işlem için giriş yapmanız gerekiyor.",
  forbidden: "Bu işlem için yetkiniz yok.",
  notFound: "Kayıt bulunamadı ya da silinmiş.",
  conflict: "Bu kayıt siz düzenlerken değişti. Güncel hâlini yükleyip tekrar deneyin.",
  rateLimited: "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.",
  spam: "Gönderim tamamlanamadı. Lütfen sayfayı yenileyip tekrar deneyin.",
  unexpected: "Bir sorun oluştu. Lütfen tekrar deneyin.",
} as const;

export type TechnicalCode = keyof typeof technicalMessages;
export type FailCode = TechnicalCode | RuleCode;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });

export function fail(code: FailCode, extra: Partial<Omit<Fail, "ok" | "code">> = {}): Fail {
  const message =
    extra.message ??
    (code in technicalMessages
      ? technicalMessages[code as TechnicalCode]
      : ruleMessages[code as RuleCode]);
  return { ok: false, code, ...extra, message };
}
