import { formatDateTime } from "@/lib/format";

/**
 * Message templates. Plain text first; add React Email for HTML when the plan asks for it.
 * Each template declares the data it needs, so callers are type-checked.
 */
const templates = {
  panelInvitation: {
    subject: (d: { venueName: string }) => `${d.venueName} paneline davet edildiniz`,
    text: (d: { venueName: string; inviterName: string; acceptUrl: string; expiresAt: string }) =>
      `Merhaba,

${d.inviterName}, sizi Kartela üzerinde ${d.venueName} mekânının paneline davet etti. Daveti kabul etmek için: ${d.acceptUrl}

Bağlantı ${formatDateTime(d.expiresAt)} tarihine kadar geçerlidir.`,
  },
  passwordReset: {
    subject: () => "Kartela parola sıfırlama",
    text: (d: { resetUrl: string }) =>
      `Merhaba,

Parolanızı sıfırlamak için: ${d.resetUrl}

Bu isteği siz yapmadıysanız bu iletiyi yok sayabilirsiniz.`,
  },
} satisfies Record<string, { subject: (data: never) => string; text: (data: never) => string }>;

export type TemplateName = keyof typeof templates;
export type TemplateData<N extends TemplateName> = Parameters<(typeof templates)[N]["text"]>[0] &
  Parameters<(typeof templates)[N]["subject"]>[0];

export function renderTemplate<N extends TemplateName>(
  name: N,
  data: TemplateData<N>,
): { subject: string; text: string } {
  const template = templates[name] as unknown as {
    subject: (d: TemplateData<N>) => string;
    text: (d: TemplateData<N>) => string;
  };
  return { subject: template.subject(data), text: template.text(data) };
}
